using System.Text.Json.Serialization;
namespace InformalTraderApi.DTOs;

public class PocketBaseTransactionItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("trader")]
    public string Trader { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("created")]
    public string Created { get; set; } = string.Empty;
}

public class PocketBaseTransactionListResponse
{
    [JsonPropertyName("items")]
    public List<PocketBaseTransactionItem> Items { get; set; } = new();
}

