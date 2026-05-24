using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using InformalTraderApi.DTOs;

namespace InformalTraderApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CreditPassportController : ControllerBase
{
    private readonly HttpClient _pocketBaseClient;

    public CreditPassportController(IHttpClientFactory clientFactory)
    {
        _pocketBaseClient = clientFactory.CreateClient("PocketBase");
    }

    // GET: api/CreditPassport/evaluate/{traderId}
    [HttpGet("evaluate/{traderId}")]
    public async Task<IActionResult> EvaluateTrustScore(string traderId)
    {
        var traderResponse = await _pocketBaseClient.GetAsync($"collections/traders/records/{traderId}");
        if (!traderResponse.IsSuccessStatusCode)
            return NotFound(new { error = "Trader profile not found." });

        var trader = await traderResponse.Content.ReadFromJsonAsync<PocketBaseFullTrader>();
        if (trader == null)
            return BadRequest(new { error = "Failed to parse trader profile." });

        var txResponse = await _pocketBaseClient.GetAsync($"collections/transactions/records?filter=trader%3D'{traderId}'&perPage=500");
        List<PocketBaseTransactionItem> items = new();
        if (txResponse.IsSuccessStatusCode)
        {
            var list = await txResponse.Content.ReadFromJsonAsync<PocketBaseTransactionListResponse>();
            if (list?.Items != null) items = list.Items;
        }

        decimal totalVolume = items.Sum(i => i.Amount);
        int txCount = items.Count;
        decimal averageTransaction = txCount > 0 ? Math.Round(totalVolume / txCount, 2) : 0m;

        DateTime? lastTransactionDate = null;
        foreach (var item in items)
        {
            if (DateTime.TryParse(item.Created, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var createdDate))
            {
                if (lastTransactionDate == null || createdDate > lastTransactionDate)
                {
                    lastTransactionDate = createdDate;
                }
            }
        }

        var volumeScore = Math.Min(40, (int)Math.Round(Math.Log10((double)totalVolume + 1) * 18));
        var frequencyScore = Math.Min(35, txCount * 2);
        var recencyScore = 0;
        if (lastTransactionDate.HasValue && (DateTime.UtcNow - lastTransactionDate.Value).TotalDays <= 30)
        {
            recencyScore = 25;
        }

        var trustScore = txCount == 0 ? 20 : Math.Clamp(volumeScore + frequencyScore + recencyScore, 0, 100);

        var creditLimit = Math.Round((decimal)trustScore / 100m * 5000m + totalVolume * 0.15m, 2);

        var response = new CreditPassportEvaluationResponse
        {
            TraderId = trader.Id,
            BusinessName = trader.BusinessName,
            TrustScore = trustScore,
            CreditLimit = creditLimit,
            TransactionsAnalyzed = txCount,
            TotalVolume = totalVolume,
            AverageTransaction = averageTransaction,
            LastTransactionDate = lastTransactionDate?.ToString("o")
        };

        return Ok(response);
    }
}
