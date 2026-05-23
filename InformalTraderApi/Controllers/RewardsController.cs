using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;

namespace InformalTraderApi.Controllers;

[ApiController]
[Route("api/[controller]")] // Endpoint: api/rewards
public class RewardsController : ControllerBase
{
    private readonly HttpClient _pocketBaseClient;

    public RewardsController(IHttpClientFactory clientFactory)
    {
        _pocketBaseClient = clientFactory.CreateClient("PocketBase");
    }

    // 1. GET: api/rewards/balance/{traderId}
    // Fetches the current reward points available for a specific trader
    [HttpGet("balance/{traderId}")]
    public async Task<IActionResult> GetPointsBalance(string traderId)
    {
        var response = await _pocketBaseClient.GetAsync($"collections/traders/records/{traderId}");

        if (!response.IsSuccessStatusCode)
        {
            return NotFound(new { error = "Trader profile not found." });
        }

        var trader = await response.Content.ReadFromJsonAsync<PocketBaseRewardProfile>();
        return Ok(new { rewardPoints = trader.Reward_Points });
    }

    // 2. POST: api/rewards/claim
    // Deducts points from the trader and issues a mock airtime voucher
    [HttpPost("claim")]
    public async Task<IActionResult> ClaimAirtimeReward([FromBody] ClaimRewardRequest request)
    {
        // Step A: Determine the points cost based on the requested airtime value
        // Simple hackathon math rule: 2 points per R1 of airtime (e.g., R10 Airtime costs 20 points)
        int requiredPoints = request.AirtimeAmount * 2;

        // Step B: Fetch the trader's profile to verify points balance
        var traderResponse = await _pocketBaseClient.GetAsync($"collections/traders/records/{request.TraderId}");
        if (!traderResponse.IsSuccessStatusCode)
        {
            return NotFound(new { error = "Trader profile not found." });
        }
        var trader = await traderResponse.Content.ReadFromJsonAsync<PocketBaseRewardProfile>();

        // Step C: Ensure the trader has enough points accumulated
        if (trader.Reward_Points < requiredPoints)
        {
            return BadRequest(new
            {
                error = "Insufficient reward points.",
                pointsRequired = requiredPoints,
                currentPoints = trader.Reward_Points
            });
        }

        // Step D: Deduct the points from the trader's profile in PocketBase
        var updatedFields = new
        {
            reward_points = trader.Reward_Points - requiredPoints
        };

        var updateResponse = await _pocketBaseClient.PatchAsJsonAsync($"collections/traders/records/{request.TraderId}", updatedFields);
        if (!updateResponse.IsSuccessStatusCode)
        {
            return BadRequest(new { error = "Failed to process reward deduction." });
        }

        // Step E: Log the claim transaction in the rewards database collection for data audits
        var rewardLog = new
        {
            trader = request.TraderId,
            reward_type = $"{request.Network.ToUpper()}_R{request.AirtimeAmount}",
            points_spent = requiredPoints
        };
        await _pocketBaseClient.PostAsJsonAsync("collections/rewards/records", rewardLog);

        // Step F: Generate a fake, random 12-digit airtime recharge PIN voucher code for the presentation demo
        var random = new Random();
        string mockVoucherCode = string.Concat(Enumerable.Range(0, 3).Select(_ => random.Next(1000, 9999).ToString()));

        return Ok(new
        {
            message = $"Success! R{request.AirtimeAmount} {request.Network} airtime voucher issued.",
            voucherCode = mockVoucherCode,
            pointsDeducted = requiredPoints,
            remainingPoints = updatedFields.reward_points
        });
    }
}

// --- DATA MODEL BINDINGS & INTERNAL SCHEMAS ---

public class ClaimRewardRequest
{
    public string TraderId { get; set; } = string.Empty;
    public string Network { get; set; } = string.Empty; // e.g., "Vodacom", "MTN", "CellC"
    public int AirtimeAmount { get; set; } // e.g., 10, 20, 50
}

public class PocketBaseRewardProfile
{
    public string Id { get; set; } = string.Empty;
    public int Reward_Points { get; set; }
}