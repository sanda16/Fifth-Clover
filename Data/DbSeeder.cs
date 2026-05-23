using TraderWallet.Api.Models;

namespace TraderWallet.Api.Data;

// Seeds three demo traders with ~2 weeks of realistic trading history.
public static class DbSeeder
{
    private static readonly string[] Sources =
        { "QR - walk-in", "SnapScan", "Zapper", "Customer tap", "Repeat customer", "Card tap" };

    public static void Seed(AppDbContext db)
    {
        if (db.Users.Any()) return; // already seeded

        var rng = new Random(2025); // fixed seed => reproducible demo data

        var profiles = new[]
        {
            //                name              SA ID number    lang  digital%  cashLow cashHigh loan
            new TraderProfile("Nomsa Dlamini",  "8702155009087", "zu", 0.65,    8000,   22000,  HasLoan: false), // spaza shop
            new TraderProfile("Sipho Khumalo",  "9105036123083", "en", 0.40,    5000,   15000,  HasLoan: true),  // street vendor
            new TraderProfile("Thandi Mthembu", "8408120456081", "xh", 0.80,    12000,  30000,  HasLoan: false), // fruit & veg
        };

        long omnibusTotal = 0;

        foreach (var p in profiles)
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = p.Name,
                IdNumber = p.IdNumber,
                Language = p.Language,
                CreatedAt = DateTime.UtcNow.AddDays(-30),
            };

            var txns = new List<Transaction>();
            long balance = 0; // digital wallet balance, in cents

            // Local helper: record a transaction and adjust the running balance.
            // sign: +1 credit, -1 debit, 0 = cash log (no effect on digital balance).
            void AddTx(TransactionType type, long amount, string? source, DateTime ts, int sign)
            {
                txns.Add(new Transaction
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Type = type,
                    AmountCents = amount,
                    Source = source,
                    Timestamp = ts,
                });
                balance += sign * amount;
            }

            // Opening float, deposited via Standard Bank.
            AddTx(TransactionType.Deposit, 5000, "Opening float", DateTime.UtcNow.Date.AddDays(-15), +1);

            for (int dayOffset = 14; dayOffset >= 0; dayOffset--)
            {
                var date = DateTime.UtcNow.Date.AddDays(-dayOffset);

                // Digital payments through the trading day.
                int payments = rng.Next(2, 7);
                for (int i = 0; i < payments; i++)
                {
                    if (rng.NextDouble() > p.DigitalBias) continue; // some customers still pay cash
                    long amount = rng.Next(1500, 8000);
                    var ts = date.AddHours(rng.Next(7, 19)).AddMinutes(rng.Next(60));
                    AddTx(TransactionType.PaymentInQr, amount, PickSource(rng), ts, +1);
                }

                // End-of-day cash takings (recorded for scoring, not in digital balance).
                long cash = rng.Next(p.DailyCashLow, p.DailyCashHigh);
                AddTx(TransactionType.CashLogDaily, cash, "Cash sales", date.AddHours(19), 0);

                // Working-capital loan disbursement + a later repayment.
                if (p.HasLoan && dayOffset == 10)
                    AddTx(TransactionType.LoanIn, 50000, "Working capital loan", date.AddHours(9), +1);
                if (p.HasLoan && dayOffset == 3 && balance >= 12000)
                    AddTx(TransactionType.LoanRepayment, 12000, "Loan repayment", date.AddHours(20), -1);

                // Occasional cash-out to restock.
                if (dayOffset == 4 && balance >= 30000)
                    AddTx(TransactionType.Withdrawal, 15000, "ATM cash-out", date.AddHours(17), -1);
            }

            user.Wallet = new Wallet { BalanceCents = balance };
            user.CreditScore = new CreditScore { Score = p.SeedScore, ComputedAt = DateTime.UtcNow };
            user.Transactions = txns;

            db.Users.Add(user);
            omnibusTotal += balance;
        }

        // The custodian (Standard Bank) holds the pooled total of every wallet.
        db.OmnibusLedger.Add(new OmnibusLedger { Id = Guid.NewGuid(), TotalCents = omnibusTotal });

        db.SaveChanges();
    }

    private static string PickSource(Random rng) => Sources[rng.Next(Sources.Length)];
}

public record TraderProfile(
    string Name, string IdNumber, string Language,
    double DigitalBias, int DailyCashLow, int DailyCashHigh, bool HasLoan)
{
    // A plausible starting score; overwritten the first time GET /api/credit-score is called.
    public int SeedScore => HasLoan ? 64 : DigitalBias >= 0.75 ? 82 : 71;
}
