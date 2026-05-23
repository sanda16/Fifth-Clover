using System.Text.Json.Serialization;

namespace InformalTraderApi.DTOs;

public class QrPaymentRequest
{
    public string TraderId { get; set; } = string.Empty; // Scanned from the QR code
    public decimal Amount { get; set; }
}

public class ExtractionRequest
{
    public string TraderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class PocketBaseTrader
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("omnibus_balance")]
    public decimal OmnibusBalance { get; set; }

    [JsonPropertyName("reward_points")]
    public int RewardPoints { get; set; }
}