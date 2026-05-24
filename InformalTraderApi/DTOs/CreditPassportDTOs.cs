using System.Text.Json.Serialization;

namespace InformalTraderApi.DTOs;

public class CreditPassportEvaluationResponse
{
    [JsonPropertyName("traderId")]
    public string TraderId { get; set; } = string.Empty;

    [JsonPropertyName("businessName")]
    public string BusinessName { get; set; } = string.Empty;

    [JsonPropertyName("trustScore")]
    public int TrustScore { get; set; }

    [JsonPropertyName("creditLimit")]
    public decimal CreditLimit { get; set; }

    [JsonPropertyName("transactionsAnalyzed")]
    public int TransactionsAnalyzed { get; set; }

    [JsonPropertyName("totalVolume")]
    public decimal TotalVolume { get; set; }

    [JsonPropertyName("averageTransaction")]
    public decimal AverageTransaction { get; set; }

    [JsonPropertyName("lastTransactionDate")]
    public string? LastTransactionDate { get; set; }
}
