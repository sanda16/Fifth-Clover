using InformalTraderApi.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace InformalTraderApi.Controllers;

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
        // 1. Clean up phone number input & parse strings into integers to match schema numbers
        if (!long.TryParse(request.PhoneNumber, out long parsedPhone) ||
            !long.TryParse(request.SaId, out long parsedId))
        {
            return BadRequest(new { error = "Phone number and SA ID must contain only numeric characters." });
        }

        // 2. Map payload. PocketBase Auth collections require an email, password, and passwordConfirm.
        var newTrader = new
        {
            email = $"{request.PhoneNumber.Trim()}@informaltrader.local", // Hackathon placeholder email
            password = request.Pin.Trim(),
            passwordConfirm = request.Pin.Trim(),
            phone_number = parsedPhone,
            business_name = request.BusinessName,
            omnibus_balance = 0.00,
            reward_points = 0,
            id_number = parsedId
        };

        // 3. Post to PocketBase records creation endpoint
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
        // 1. Generate fake identity email because PocketBase Auth uses "email" as identity
        string identityEmail = $"{request.PhoneNumber.Trim()}@informaltrader.local";

        var loginPayload = new
        {
            identity = identityEmail,
            password = request.Pin.Trim()
        };

        // 2. Direct hit to PocketBase's native Auth token authentication router
        var response = await _pocketBaseClient.PostAsJsonAsync("collections/traders/auth-with-password", loginPayload);

        if (!response.IsSuccessStatusCode)
        {
            return Unauthorized(new { error = "Invalid phone number or PIN authentication failed." });
        }

        // 3. Extract verified user profile item from inside PocketBase OAuth token response wrapper
        var authResult = await response.Content.ReadFromJsonAsync<PocketBaseAuthSuccessResponse>();

        if (authResult?.Record == null)
        {
            return NotFound(new { error = "Trader record profile parsing failed." });
        }

        // 4. Return clean context response state for your React frontend 
        return Ok(new
        {
            message = "Login successful!",
            token = authResult.Token, // Pass your JWT token back to the frontend
            userId = authResult.Record.Id,
            idNumber = authResult.Record.IdNumber.ToString(),
            businessName = authResult.Record.BusinessName,
            phoneNumber = authResult.Record.PhoneNumber.ToString()
        });
    }
}

// Direct sub-helper wrapper parsing success tokens from native PocketBase Auth endpoints
public class PocketBaseAuthSuccessResponse
{
    [JsonPropertyName("token")]
    public string Token { get; set; } = string.Empty;

    [JsonPropertyName("record")]
    public PocketBaseTraderItem Record { get; set; } = new();
}