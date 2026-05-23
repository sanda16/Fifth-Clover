namespace TraderWallet.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string IdNumber { get; set; } = string.Empty;
    public string Language { get; set; } = "en";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Wallet? Wallet { get; set; }
    public CreditScore? CreditScore { get; set; }
    public List<Transaction> Transactions { get; set; } = new();
}
