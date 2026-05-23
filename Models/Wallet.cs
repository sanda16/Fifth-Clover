namespace TraderWallet.Api.Models;

// One wallet per user. UserId is the primary key (one-to-one with User).
public class Wallet
{
    public Guid UserId { get; set; }
    public long BalanceCents { get; set; } = 0;

    public User? User { get; set; }
}
