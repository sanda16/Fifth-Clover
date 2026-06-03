using System.Text.Json.Serialization;

namespace InformalTraderApi.DTOs;

// Consolidated DTOs to keep the workspace clean.
public class RegisterRequest
{
    public string SaId { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty;
}

public class PocketBaseTraderItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("phone_number")]
    public long PhoneNumber { get; set; }

    [JsonPropertyName("business_name")]
    public string BusinessName { get; set; } = string.Empty;

    [JsonPropertyName("id_number")]
    public long IdNumber { get; set; }

    // CRITICAL FIX: These were missing earlier. The CreditController needs these to feed the ML engine.
    [JsonPropertyName("omnibus_balance")]
    public decimal OmnibusBalance { get; set; }

    [JsonPropertyName("reward_points")]
    public int RewardPoints { get; set; }

    // NEW: Accounting for "Money Out" (Expenses/Withdrawals) to prevent fraud in the ML model.
    [JsonPropertyName("verified_outflows")]
    public decimal VerifiedOutflows { get; set; }
}

public class PocketBaseAuthSuccessResponse
{
    [JsonPropertyName("token")]
    public string Token { get; set; } = string.Empty;

    [JsonPropertyName("record")]
    public PocketBaseTraderItem Record { get; set; } = new();
}

public class TransactionRequest
{
    public string TraderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty; // "Cash_In" or "Cash_Out"
}