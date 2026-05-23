using Microsoft.AspNetCore.Mvc;
using TraderWallet.Api.Data;
using TraderWallet.Api.Dtos;
using TraderWallet.Api.Models;

namespace TraderWallet.Api.Controllers;

[ApiController]
[Route("api/identity")]
public class IdentityController : ControllerBase
{
    private readonly AppDbContext _db;
    public IdentityController(AppDbContext db) => _db = db;

    // POST /api/identity/verify  { "id_number": "...", "full_name": "..." }
    [HttpPost("verify")]
    public ActionResult<VerifyIdentityResponse> Verify([FromBody] VerifyIdentityRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.IdNumber) || string.IsNullOrWhiteSpace(req.FullName))
            return BadRequest(new { error = "id_number and full_name are required" });

        // Mock KYC: in production this would call Home Affairs / Standard Bank.
        // Here we always "pass" and either return the existing user or onboard a new one.
        var user = _db.Users.FirstOrDefault(u => u.IdNumber == req.IdNumber);
        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                FullName = req.FullName,
                IdNumber = req.IdNumber,
                Language = "en",
                CreatedAt = DateTime.UtcNow,
                Wallet = new Wallet { BalanceCents = 0 },
                CreditScore = new CreditScore { Score = 50, ComputedAt = DateTime.UtcNow },
            };
            _db.Users.Add(user);
            _db.SaveChanges();
        }

        return Ok(new VerifyIdentityResponse(user.Id, user.FullName, Verified: true));
    }
}
