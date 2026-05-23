namespace TraderWallet.Api.Models;

// One score per user. UserId is the primary key (one-to-one with User).
public class CreditScore
{
    public Guid UserId { get; set; }
    public int Score { get; set; } // 0 - 100
    public DateTime ComputedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
