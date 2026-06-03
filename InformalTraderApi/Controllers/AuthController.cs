using InformalTraderApi.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;

namespace InformalTraderApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly HttpClient _pocketBaseClient;

    public AuthController(IHttpClientFactory clientFactory)
    {
        _pocketBaseClient = clientFactory.CreateClient("PocketBase");
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // Data cleaning: Ensure numbers are actually numbers before hitting PocketBase
        if (!long.TryParse(request.PhoneNumber, out long parsedPhone) ||
            !long.TryParse(request.SaId, out long parsedId))
        {
            return BadRequest(new { error = "Phone and ID must be numeric." });
        }

        var newTrader = new
        {
            email = $"{request.PhoneNumber.Trim()}@informaltrader.local",
            password = request.Pin.Trim(),
            passwordConfirm = request.Pin.Trim(),
            phone_number = parsedPhone,
            business_name = request.BusinessName,
            omnibus_balance = 0.00,
            reward_points = 0,
            verified_outflows = 0.00, // Initialize money out ledger
            id_number = parsedId
        };

        var response = await _pocketBaseClient.PostAsJsonAsync("collections/traders/records", newTrader);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return BadRequest(new { error = "Registration failed.", details = error });
        }

        var createdProfile = await response.Content.ReadFromJsonAsync<object>();
        return Ok(new { message = "Registration successful!", user = createdProfile });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        string identityEmail = $"{request.PhoneNumber.Trim()}@informaltrader.local";

        var loginPayload = new
        {
            identity = identityEmail,
            password = request.Pin.Trim()
        };

        var response = await _pocketBaseClient.PostAsJsonAsync("collections/traders/auth-with-password", loginPayload);

        if (!response.IsSuccessStatusCode)
        {
            return Unauthorized(new { error = "Authentication failed." });
        }

        var authResult = await response.Content.ReadFromJsonAsync<PocketBaseAuthSuccessResponse>();

        if (authResult?.Record == null) return NotFound(new { error = "Record parsing failed." });

        return Ok(new
        {
            message = "Login successful!",
            token = authResult.Token,
            userId = authResult.Record.Id,
            idNumber = authResult.Record.IdNumber.ToString(),
            businessName = authResult.Record.BusinessName,
            phoneNumber = authResult.Record.PhoneNumber.ToString()
        });
    }
}