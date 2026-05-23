using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TraderWallet.Api.Data;
using TraderWallet.Api.Models;

namespace TraderWallet.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public DashboardController(AppDbContext db) => _db = db;

    // GET /api/dashboard/{userId} -> last 7 days of revenue, split into digital and cash.
    [HttpGet("{userId:guid}")]
    public ActionResult GetDashboard(Guid userId)
    {
        var user = _db.Users.Include(u => u.Wallet).FirstOrDefault(u => u.Id == userId);
        if (user is null) return NotFound(new { error = "User not found" });

        var start = DateTime.UtcNow.Date.AddDays(-6); // 7 calendar days including today

        var txns = _db.Transactions
            .Where(t => t.UserId == userId && t.Timestamp >= start)
            .ToList();

        var days = Enumerable.Range(0, 7).Select(i =>
        {
            var day = start.AddDays(i);
            var dayTx = txns.Where(t => t.Timestamp.Date == day).ToList();

            long digital = dayTx
                .Where(t => t.Type == TransactionType.PaymentInQr || t.Type == TransactionType.TransferIn)
                .Sum(t => t.AmountCents);
            long cash = dayTx
                .Where(t => t.Type == TransactionType.CashLogDaily)
                .Sum(t => t.AmountCents);

            return new
            {
                date = day.ToString("yyyy-MM-dd"),
                dayOfWeek = day.DayOfWeek.ToString(),
                digitalCents = digital,
                cashCents = cash,
                totalCents = digital + cash,
            };
        }).ToList();

        return Ok(new
        {
            userId,
            fullName = user.FullName,
            balanceCents = user.Wallet?.BalanceCents ?? 0,
            weekDigitalCents = days.Sum(d => d.digitalCents),
            weekCashCents = days.Sum(d => d.cashCents),
            weekTotalCents = days.Sum(d => d.totalCents),
            days,
        });
    }
}
