using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TraderWallet.Api.Data;

namespace TraderWallet.Api.Controllers;

[ApiController]
[Route("api/wallet")]
public class WalletController : ControllerBase
{
    private readonly AppDbContext _db;
    public WalletController(AppDbContext db) => _db = db;

    // GET /api/wallet/{userId} -> balance + 10 most recent transactions
    [HttpGet("{userId:guid}")]
    public ActionResult GetWallet(Guid userId)
    {
        var user = _db.Users.Include(u => u.Wallet).FirstOrDefault(u => u.Id == userId);
        if (user is null) return NotFound(new { error = "User not found" });

        var balance = user.Wallet?.BalanceCents ?? 0;

        var recent = _db.Transactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.Timestamp)
            .Take(10)
            .AsEnumerable()
            .Select(t => new
            {
                t.Id,
                type = t.Type.ToString(),
                t.AmountCents,
                amountRand = t.AmountCents / 100m,
                t.Source,
                t.Timestamp,
            })
            .ToList();

        return Ok(new
        {
            userId = user.Id,
            fullName = user.FullName,
            balanceCents = balance,
            balanceRand = balance / 100m,
            recentTransactions = recent,
        });
    }
}
