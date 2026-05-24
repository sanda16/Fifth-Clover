using System.Text.Json.Serialization;

namespace InformalTraderApi.DTOs;

// 1. INPUT DTO: Data sent from your React Frontend to Register a Trader
public class RegisterRequest
{
    public string SaId { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
}

// 2. INPUT DTO: Data sent from your React Frontend to Login
public class LoginRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty;
}

// 3. DESERIALIZATION HELPER: Parses PocketBase's array response wrapper
public class PocketBaseListResponse
{
    [JsonPropertyName("items")]
    public List<PocketBaseTraderItem> Items { get; set; } = new();
}

// 4. DESERIALIZATION HELPER: Matches your exact PocketBase schema data types
public class PocketBaseTraderItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("phone_number")]
    public string PhoneNumber { get; set; } = string.Empty; // Stored as text to keep the leading 0

    [JsonPropertyName("business_name")]
    public string BusinessName { get; set; } = string.Empty;

    [JsonPropertyName("id_number")]
    public string IdNumber { get; set; } = string.Empty; // Stored as text to keep leading zeros

    [JsonPropertyName("omnibus_balance")]
    public decimal OmnibusBalance { get; set; }

    // Note: PocketBase never returns the password/pin in the response payload for safety.
    // We will verify logins using PocketBase's official authentication endpoint instead.
}