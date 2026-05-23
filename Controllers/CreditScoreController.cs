using Microsoft.AspNetCore.Mvc;
using TraderWallet.Api.Data;
using TraderWallet.Api.Models;

namespace TraderWallet.Api.Controllers;

[ApiController]
[Route("api/credit-score")]
public class CreditScoreController : ControllerBase
{
    private readonly AppDbContext _db;
    public CreditScoreController(AppDbContext db) => _db = db;

    // GET /api/credit-score/{userId} -> a 0-100 score with an explainable breakdown.
    [HttpGet("{userId:guid}")]
    public ActionResult GetScore(Guid userId)
    {
        var user = _db.Users.FirstOrDefault(u => u.Id == userId);
        if (user is null) return NotFound(new { error = "User not found" });

        var since = DateTime.UtcNow.AddDays(-30);
        var income = _db.Transactions
            .Where(t => t.UserId == userId && t.Timestamp >= since)
            .Where(t => t.Type == TransactionType.PaymentInQr
                     || t.Type == TransactionType.CashLogDaily
                     || t.Type == TransactionType.TransferIn
                     || t.Type == TransactionType.Deposit)
            .ToList();

        long totalRevenueCents = income.Sum(t => t.AmountCents);
        int activeDays = income.Select(t => t.Timestamp.Date).Distinct().Count();
        double digitalShare = income.Count == 0
            ? 0
            : (double)income.Count(t => t.Type == TransactionType.PaymentInQr) / income.Count;

        // Simple, explainable hackathon model:
        //   consistency (days traded) + turnover (revenue) + how "digital" the trader is.
        double consistency = Math.Min(activeDays, 30) / 30.0 * 40;          // up to 40 pts
        double turnover = Math.Min(totalRevenueCents / 500_000.0, 1) * 35;  // R5,000 / 30d => full 35 pts
        double digital = digitalShare * 25;                                 // up to 25 pts
        int score = (int)Math.Round(Math.Clamp(consistency + turnover + digital, 0, 100));

        // Persist the latest score.
        var stored = _db.CreditScores.FirstOrDefault(c => c.UserId == userId);
        if (stored is null)
        {
            stored = new CreditScore { UserId = userId, Score = score, ComputedAt = DateTime.UtcNow };
            _db.CreditScores.Add(stored);
        }
        else
        {
            stored.Score = score;
            stored.ComputedAt = DateTime.UtcNow;
        }
        _db.SaveChanges();

        string band = score >= 75 ? "Excellent" : score >= 50 ? "Good" : score >= 25 ? "Building" : "New";

        return Ok(new
        {
            userId,
            score,
            band,
            computedAt = stored.ComputedAt,
            factors = new
            {
                activeDaysLast30 = activeDays,
                totalRevenueCents,
                totalRevenueRand = totalRevenueCents / 100m,
                digitalSharePct = Math.Round(digitalShare * 100, 1),
            },
        });
    }
}
