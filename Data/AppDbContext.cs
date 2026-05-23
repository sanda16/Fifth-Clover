using Microsoft.EntityFrameworkCore;
using TraderWallet.Api.Models;

namespace TraderWallet.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<CreditScore> CreditScores => Set<CreditScore>();
    public DbSet<OmnibusLedger> OmnibusLedger => Set<OmnibusLedger>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        // One-to-one: User <-> Wallet, keyed on UserId.
        model.Entity<Wallet>().HasKey(w => w.UserId);
        model.Entity<User>()
            .HasOne(u => u.Wallet)
            .WithOne(w => w.User!)
            .HasForeignKey<Wallet>(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // One-to-one: User <-> CreditScore, keyed on UserId.
        model.Entity<CreditScore>().HasKey(c => c.UserId);
        model.Entity<User>()
            .HasOne(u => u.CreditScore)
            .WithOne(c => c.User!)
            .HasForeignKey<CreditScore>(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // One-to-many: User -> Transactions.
        model.Entity<User>()
            .HasMany(u => u.Transactions)
            .WithOne(t => t.User!)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Store the enum as readable text in the DB.
        model.Entity<Transaction>()
            .Property(t => t.Type)
            .HasConversion<string>();

        // Look-ups by user are common.
        model.Entity<User>().HasIndex(u => u.IdNumber).IsUnique();
        model.Entity<Transaction>().HasIndex(t => new { t.UserId, t.Timestamp });
    }
}
