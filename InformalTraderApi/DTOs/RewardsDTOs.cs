using System.Text.Json.Serialization;

namespace InformalTraderApi.DTOs;

public class ClaimRewardRequest
{
    public string TraderId { get; set; } = string.Empty;
    public string Network { get; set; } = string.Empty; // MUST be exactly "Vodacom", "MTN", or "CellC"
    public int AirtimeAmount { get; set; } // e.g., 10, 20
}

public class PocketBaseRewardProfile
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("reward_points")]
    public int RewardPoints { get; set; }
}