using InformalTraderApi.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;

namespace InformalTraderApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CreditController : ControllerBase
{
    private readonly HttpClient _pocketBaseClient;
    private readonly HttpClient _pythonMlClient;

    public CreditController(IHttpClientFactory clientFactory)
    {
        _pocketBaseClient = clientFactory.CreateClient("PocketBase");
        _pythonMlClient = clientFactory.CreateClient("PythonML");
    }

    [HttpPost("check-eligibility")]
    public async Task<IActionResult> EvaluateCredit([FromBody] string traderId)
    {
        // 1. Fetch user data
        // Note: For the hackathon demo, we are querying by ID Number, but usually this is by the UUID.
        // Assuming the React app passes the ID Number for this specific endpoint setup.

        // Mocking the database fetch specifically to ensure the ML engine receives structured data
        // This includes the new "verified_outflows" logic to prove the user actually spends money.
        var pythonPayload = new
        {
            user_id = traderId,
            profile_type = "hawker",
            omnibus_balance = 450.00,
            physical_cash_logged_30d = 3200.00,
            transaction_count = 45,
            reward_points = 120,
            verified_outflows = 850.00 // The "Money Out" metric required by the ML model
        };

        try
        {
            // 2. Transmit to the Python Data Science Engine
            var mlResponse = await _pythonMlClient.PostAsJsonAsync("api/evaluate", pythonPayload);
            mlResponse.EnsureSuccessStatusCode();

            var creditDecision = await mlResponse.Content.ReadFromJsonAsync<object>();
            return Ok(creditDecision);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "The Python ML Microservice is offline or rejected the payload.", message = ex.Message });
        }
    }
}