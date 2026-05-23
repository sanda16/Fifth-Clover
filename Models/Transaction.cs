namespace TraderWallet.Api.Models;

// Amounts are always stored as a positive number of cents; Type encodes the direction.
public class Transaction
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public TransactionType Type { get; set; }
    public long AmountCents { get; set; }
    public string? Source { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
