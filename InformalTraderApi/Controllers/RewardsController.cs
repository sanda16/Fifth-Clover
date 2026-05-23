using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using InformalTraderApi.DTOs;

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
    [HttpGet("balance/{traderId}")]
    public async Task<IActionResult> GetPointsBalance(string traderId)
    {
        var response = await _pocketBaseClient.GetAsync($"collections/traders/records/{traderId}");

        if (!response.IsSuccessStatusCode)
        {
            return NotFound(new { error = "Trader profile not found." });
        }

        var trader = await response.Content.ReadFromJsonAsync<PocketBaseRewardProfile>();

        if (trader == null)
        {
            return BadRequest(new { error = "Failed to parse trader profile." });
        }

        return Ok(new { rewardPoints = trader.RewardPoints });
    }

    // 2. POST: api/rewards/claim
    [HttpPost("claim")]
    public async Task<IActionResult> ClaimAirtimeReward([FromBody] ClaimRewardRequest request)
    {
        // Step A: Determine the points cost (R1 = 2 points)
        int requiredPoints = request.AirtimeAmount * 2;

        // Step B: Fetch the trader's profile to verify points balance
        var traderResponse = await _pocketBaseClient.GetAsync($"collections/traders/records/{request.TraderId}");
        if (!traderResponse.IsSuccessStatusCode)
        {
            return NotFound(new { error = "Trader profile not found." });
        }

        var trader = await traderResponse.Content.ReadFromJsonAsync<PocketBaseRewardProfile>();
        if (trader == null)
        {
            return BadRequest(new { error = "Failed to parse trader profile." });
        }

        // Step C: Ensure the trader has enough points accumulated
        if (trader.RewardPoints < requiredPoints)
        {
            return BadRequest(new
            {
                error = "Insufficient reward points.",
                pointsRequired = requiredPoints,
                currentPoints = trader.RewardPoints
            });
        }

        // Step D: Deduct the points from the trader's profile
        var updatedFields = new
        {
            reward_points = trader.RewardPoints - requiredPoints
        };

        var updateResponse = await _pocketBaseClient.PatchAsJsonAsync($"collections/traders/records/{request.TraderId}", updatedFields);
        if (!updateResponse.IsSuccessStatusCode)
        {
            return BadRequest(new { error = "Failed to process reward deduction." });
        }

        // Step E: Log the claim transaction (Ensuring exact case match with PocketBase schema values)
        var rewardLog = new
        {
            trader = request.TraderId,
            reward_type = $"{request.Network}_R{request.AirtimeAmount}", // E.g., "Vodacom_R10"
            points_spent = requiredPoints
        };

        var logResponse = await _pocketBaseClient.PostAsJsonAsync("collections/rewards/records", rewardLog);

        if (!logResponse.IsSuccessStatusCode)
        {
            // Good practice: catch log failures so you know if your DB schema rejected the string
            var errorDetails = await logResponse.Content.ReadAsStringAsync();
            return BadRequest(new { error = "Reward issued, but failed to log to ledger (check your DB schema Dropdown values!).", details = errorDetails });
        }

        // Step F: Generate a fake, random 12-digit airtime recharge PIN
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