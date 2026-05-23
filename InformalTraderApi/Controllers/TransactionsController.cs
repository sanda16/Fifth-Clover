using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using InformalTraderApi.DTOs;

namespace InformalTraderApi.Controllers;

[ApiController]
[Route("api/[controller]")] // Route: api/transactions
public class TransactionsController : ControllerBase
{
    private readonly HttpClient _pocketBaseClient;

    public TransactionsController(IHttpClientFactory clientFactory)
    {
        _pocketBaseClient = clientFactory.CreateClient("PocketBase");
    }

    // 1. POST: api/transactions/scan-qr (Customer Pays via Central Omnibus Account)
    [HttpPost("scan-qr")]
    public async Task<IActionResult> ScanQrPayment([FromBody] QrPaymentRequest request)
    {
        // Step A: Fetch the trader's current profile from PocketBase
        var traderResponse = await _pocketBaseClient.GetAsync($"collections/traders/records/{request.TraderId}");
        if (!traderResponse.IsSuccessStatusCode)
        {
            return NotFound(new { error = "Trader profile not found." });
        }
        var trader = await traderResponse.Content.ReadFromJsonAsync<PocketBaseTrader>();

        if (trader == null)
        {
            return BadRequest(new { error = "Failed to parse trader profile." });
        }

        // Step B: Calculate Rewards Hook (10% of transaction value converted to points)
        int calculatedPointsEarned = (int)Math.Floor(request.Amount * 0.10m);

        // Step C: Allocate the incoming customer payment to the trader's balance inside the Omnibus pool
        var updatedFields = new
        {
            omnibus_balance = trader.OmnibusBalance + request.Amount,
            reward_points = trader.RewardPoints + calculatedPointsEarned
        };

        var updateResponse = await _pocketBaseClient.PatchAsJsonAsync($"collections/traders/records/{request.TraderId}", updatedFields);
        if (!updateResponse.IsSuccessStatusCode)
        {
            return BadRequest(new { error = "Failed to update trader balance virtual allocation." });
        }

        // Step D: Log the structured payment into your digital ledger
        var ledgerLog = new
        {
            trader = request.TraderId,
            type = "Cash_log", // FIXED: Matches allowed database dropdown options
            amount = request.Amount,
            description = $"Customer QR payment settled into central Omnibus Account. Points earned: {calculatedPointsEarned}"
        };

        await _pocketBaseClient.PostAsJsonAsync("collections/transactions/records", ledgerLog);

        return Ok(new
        {
            message = "Payment settled via Omnibus Account successfully!",
            newBalance = updatedFields.omnibus_balance,
            pointsEarned = calculatedPointsEarned,
            totalPoints = updatedFields.reward_points
        });
    }

    // 2. POST: api/transactions/extract (Trader Cash-Out/Withdrawal)
    [HttpPost("extract")]
    public async Task<IActionResult> ExtractFunds([FromBody] ExtractionRequest request)
    {
        // Step A: Fetch the trader profile to verify current funds
        var traderResponse = await _pocketBaseClient.GetAsync($"collections/traders/records/{request.TraderId}");
        if (!traderResponse.IsSuccessStatusCode)
        {
            return NotFound(new { error = "Trader profile not found." });
        }
        var trader = await traderResponse.Content.ReadFromJsonAsync<PocketBaseTrader>();

        if (trader == null)
        {
            return BadRequest(new { error = "Failed to parse trader profile." });
        }

        // Step B: Ensure they have enough money in their portion of the Omnibus account
        if (trader.OmnibusBalance < request.Amount)
        {
            return BadRequest(new { error = "Insufficient funds in your digital wallet." });
        }

        // Step C: Deduct from their balance
        var updatedFields = new
        {
            omnibus_balance = trader.OmnibusBalance - request.Amount
        };

        var updateResponse = await _pocketBaseClient.PatchAsJsonAsync($"collections/traders/records/{request.TraderId}", updatedFields);
        if (!updateResponse.IsSuccessStatusCode)
        {
            return BadRequest(new { error = "Failed to execute fund extraction transaction." });
        }

        // Step D: Log the extraction into the ledger
        var ledgerLog = new
        {
            trader = request.TraderId,
            type = "withdrawal", // Matches "withdrawal" value allowed in schema list options
            amount = request.Amount,
            description = "Extracted funds via Standard Bank Instant Money voucher code."
        };

        await _pocketBaseClient.PostAsJsonAsync("collections/transactions/records", ledgerLog);

        return Ok(new
        {
            message = "Extraction successful! Your Instant Money SMS code is being generated.",
            remainingBalance = updatedFields.omnibus_balance
        });
    }
}