using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using InformalTraderApi.DTOs;

namespace InformalTraderApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RewardsController : ControllerBase
{
    private readonly HttpClient _pocketBaseClient;

    public RewardsController(IHttpClientFactory clientFactory)
    {
        _pocketBaseClient = clientFactory.CreateClient("PocketBase");
    }

    // GET: api/Rewards/balance/{traderId}
    [HttpGet("balance/{traderId}")]
    public async Task<IActionResult> GetPointsBalance(string traderId)
    {
        var response = await _pocketBaseClient.GetAsync($"collections/traders/records/{traderId}");

        if (!response.IsSuccessStatusCode)
            return NotFound(new { error = "Trader profile not found." });

        var trader = await response.Content.ReadFromJsonAsync<PocketBaseTrader>();
        if (trader == null)
            return BadRequest(new { error = "Failed to parse trader profile." });

        return Ok(new { traderId = traderId, rewardPoints = trader.RewardPoints });
    }

    // POST: api/Rewards/claim
    [HttpPost("claim")]
    public async Task<IActionResult> ClaimAirtime([FromBody] ClaimRewardRequest request)
    {
        if (request == null || string.IsNullOrEmpty(request.TraderId))
            return BadRequest(new { error = "Invalid request." });

        var traderResponse = await _pocketBaseClient.GetAsync($"collections/traders/records/{request.TraderId}");
        if (!traderResponse.IsSuccessStatusCode)
            return NotFound(new { error = "Trader profile not found." });

        var trader = await traderResponse.Content.ReadFromJsonAsync<PocketBaseTrader>();
        if (trader == null)
            return BadRequest(new { error = "Failed to parse trader profile." });

        var pointsCost = request.AirtimeAmount;
        if (trader.RewardPoints < pointsCost)
            return BadRequest(new { error = "Insufficient reward points." });

        var updatedFields = new { reward_points = trader.RewardPoints - pointsCost };
        var updateResponse = await _pocketBaseClient.PatchAsJsonAsync($"collections/traders/records/{request.TraderId}", updatedFields);
        if (!updateResponse.IsSuccessStatusCode)
            return BadRequest(new { error = "Failed to update reward balance." });

        var ledgerLog = new
        {
            trader = request.TraderId,
            type = "reward_claim",
            amount = 0,
            description = $"Claimed airtime {request.AirtimeAmount} on {request.Network}. Points spent: {pointsCost}"
        };

        await _pocketBaseClient.PostAsJsonAsync("collections/transactions/records", ledgerLog);

        var voucherCode = $"VCHR-{Guid.NewGuid().ToString().Replace("-", "").Substring(0, 10).ToUpper()}";

        return Ok(new { message = "Airtime voucher issued.", voucherCode = voucherCode, remainingPoints = trader.RewardPoints - pointsCost });
    }
}