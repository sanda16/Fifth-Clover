namespace TraderWallet.Api.Models;

// A single row representing the pooled Standard Bank omnibus (custodian) account.
// The sum of every wallet balance should reconcile to TotalCents.
public class OmnibusLedger
{
    public Guid Id { get; set; }
    public long TotalCents { get; set; }
}
