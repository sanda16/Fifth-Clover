using System.Text.Json.Serialization;

namespace InformalTraderApi.DTOs;

public class PocketBaseFullTrader
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("phone_number")]
    public string PhoneNumber { get; set; } = string.Empty;

    [JsonPropertyName("business_name")]
    public string BusinessName { get; set; } = string.Empty;

    [JsonPropertyName("id_number")]
    public string IdNumber { get; set; } = string.Empty;

    [JsonPropertyName("omnibus_balance")]
    public decimal OmnibusBalance { get; set; }

    [JsonPropertyName("reward_points")]
    public int RewardPoints { get; set; }
}
