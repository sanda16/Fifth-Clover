using Microsoft.AspNetCore.Mvc;
using TraderWallet.Api.Data;

namespace TraderWallet.Api.Controllers;

// Bonus endpoint: shows the Standard Bank omnibus (custodian) position and that it
// reconciles against the sum of every individual wallet. Not in the original spec,
// but it makes the OmnibusLedger entity meaningful for the demo.
[ApiController]
[Route("api/custodian")]
public class CustodianController : ControllerBase
{
    private readonly AppDbContext _db;
    public CustodianController(AppDbContext db) => _db = db;

    // GET /api/custodian/omnibus
    [HttpGet("omnibus")]
    public ActionResult GetOmnibus()
    {
        var omnibus = _db.OmnibusLedger.FirstOrDefault();
        long ledgerTotal = omnibus?.TotalCents ?? 0;
        long walletsTotal = _db.Wallets.Sum(w => (long?)w.BalanceCents) ?? 0;

        return Ok(new
        {
            custodian = "Standard Bank",
            omnibusTotalCents = ledgerTotal,
            walletsTotalCents = walletsTotal,
            reconciled = ledgerTotal == walletsTotal,
            differenceCents = ledgerTotal - walletsTotal,
        });
    }
}
