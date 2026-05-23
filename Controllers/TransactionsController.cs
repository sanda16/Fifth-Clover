using Microsoft.AspNetCore.Mvc;
using TraderWallet.Api.Data;
using TraderWallet.Api.Dtos;
using TraderWallet.Api.Models;

namespace TraderWallet.Api.Controllers;

[ApiController]
[Route("api/transactions")]
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _db;
    public TransactionsController(AppDbContext db) => _db = db;

    // POST /api/transactions/payment-in -> credit the wallet (QR payment received)
    [HttpPost("payment-in")]
    public ActionResult PaymentIn([FromBody] PaymentInRequest req)
    {
        if (req.AmountCents <= 0) return BadRequest(new { error = "amountCents must be positive" });

        var wallet = _db.Wallets.FirstOrDefault(w => w.UserId == req.UserId);
        if (wallet is null) return NotFound(new { error = "Wallet not found" });

        wallet.BalanceCents += req.AmountCents;

        var tx = new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = req.UserId,
            Type = TransactionType.PaymentInQr,
            AmountCents = req.AmountCents,
            Source = string.IsNullOrWhiteSpace(req.Source) ? "QR payment" : req.Source,
            Timestamp = DateTime.UtcNow,
        };
        _db.Transactions.Add(tx);

        // Funds settle into the Standard Bank omnibus account.
        var omnibus = _db.OmnibusLedger.FirstOrDefault();
        if (omnibus is null)
        {
            omnibus = new OmnibusLedger { Id = Guid.NewGuid() };
            _db.OmnibusLedger.Add(omnibus);
        }
        omnibus.TotalCents += req.AmountCents;

        _db.SaveChanges();

        return Ok(new { transactionId = tx.Id, newBalanceCents = wallet.BalanceCents });
    }

    // POST /api/transactions/cash-log -> record daily cash takings (no digital balance change)
    [HttpPost("cash-log")]
    public ActionResult CashLog([FromBody] CashLogRequest req)
    {
        if (req.AmountCents <= 0) return BadRequest(new { error = "amountCents must be positive" });

        var user = _db.Users.FirstOrDefault(u => u.Id == req.UserId);
        if (user is null) return NotFound(new { error = "User not found" });

        var tx = new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = req.UserId,
            Type = TransactionType.CashLogDaily,
            AmountCents = req.AmountCents,
            Source = "Cash sales",
            Timestamp = DateTime.UtcNow,
        };
        _db.Transactions.Add(tx);
        _db.SaveChanges();

        return Ok(new { transactionId = tx.Id, logged = true });
    }

    // POST /api/transactions/transfer -> wallet-to-wallet (internal to the omnibus)
    [HttpPost("transfer")]
    public ActionResult Transfer([FromBody] TransferRequest req)
    {
        if (req.AmountCents <= 0) return BadRequest(new { error = "amountCents must be positive" });
        if (req.FromUserId == req.ToUserId) return BadRequest(new { error = "Cannot transfer to the same wallet" });

        var from = _db.Wallets.FirstOrDefault(w => w.UserId == req.FromUserId);
        var to = _db.Wallets.FirstOrDefault(w => w.UserId == req.ToUserId);
        if (from is null || to is null) return NotFound(new { error = "Sender or recipient wallet not found" });
        if (from.BalanceCents < req.AmountCents) return BadRequest(new { error = "Insufficient funds" });

        from.BalanceCents -= req.AmountCents;
        to.BalanceCents += req.AmountCents;

        var now = DateTime.UtcNow;
        _db.Transactions.Add(new Transaction
        {
            Id = Guid.NewGuid(), UserId = req.FromUserId, Type = TransactionType.TransferOut,
            AmountCents = req.AmountCents, Source = $"Transfer to {req.ToUserId}", Timestamp = now,
        });
        _db.Transactions.Add(new Transaction
        {
            Id = Guid.NewGuid(), UserId = req.ToUserId, Type = TransactionType.TransferIn,
            AmountCents = req.AmountCents, Source = $"Transfer from {req.FromUserId}", Timestamp = now,
        });

        // Internal transfer: the omnibus total is unchanged, only the split between wallets moves.
        _db.SaveChanges();

        return Ok(new { fromBalanceCents = from.BalanceCents, toBalanceCents = to.BalanceCents });
    }
}
