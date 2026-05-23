using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using InformalTraderApi.DTOs;

namespace InformalTraderApi;

[ApiController]
[Route("api/[controller]")] // Endpoint: api/auth
public class AuthController : ControllerBase
{
    private readonly HttpClient _pocketBaseClient;

    public AuthController(IHttpClientFactory clientFactory)
    {
        _pocketBaseClient = clientFactory.CreateClient("PocketBase");
    }

    // POST: api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // 1. Map incoming DTO to match your exact PocketBase database conventions
        var newTrader = new
        {
            phone_number = request.PhoneNumber,
            pin = request.Pin,
            business_name = request.BusinessName,
            omnibus_balance = 0.00,
            reward_points = 0,
            id_number = request.SaId // Matched to your custom field
        };

        // 2. Post directly to PocketBase's REST API endpoint
        var response = await _pocketBaseClient.PostAsJsonAsync("collections/traders/records", newTrader);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return BadRequest(new { error = "Registration failed.", details = error });
        }

        var createdProfile = await response.Content.ReadFromJsonAsync<object>();
        return Ok(new { message = "Registration successful!", user = createdProfile });
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // 1. Query PocketBase using raw REST filtering to find the phone number
        string filter = $"(phone_number='{request.PhoneNumber}')";
        var response = await _pocketBaseClient.GetAsync($"collections/traders/records?filter={Uri.EscapeDataString(filter)}");

        if (!response.IsSuccessStatusCode)
        {
            return StatusCode((int)response.StatusCode, new { error = "Database connection error." });
        }

        var result = await response.Content.ReadFromJsonAsync<PocketBaseListResponse>();

        if (result == null || result.Items.Count == 0)
        {
            return NotFound(new { error = "No trader found with this phone number." });
        }

        var trader = result.Items[0];

        // 2. Simple, fast hackathon credentials check
        if (trader.Pin != request.Pin)
        {
            return BadRequest(new { error = "Invalid PIN." });
        }

        // 3. Return clean JSON data for your React Frontend to track session state 
        return Ok(new
        {
            message = "Login successful!",
            userId = trader.Id,         // PocketBase system record ID
            idNumber = trader.Id_Number, // Your custom SA ID field
            businessName = trader.Business_Name,
            phoneNumber = trader.Phone_Number
        });
    }
}

// Helper classes to cleanly parse the raw PocketBase JSON structure response
public class PocketBaseListResponse
{
    public List<PocketBaseTraderItem> Items { get; set; } = new();
}

public class PocketBaseTraderItem
{
    public string Id { get; set; } = string.Empty; // System record identifier
    public string Phone_Number { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty;
    public string Business_Name { get; set; } = string.Empty;
    public string Id_Number { get; set; } = string.Empty; // Matched convention
}