using System.Text.Json.Serialization;

namespace TraderWallet.Api.Dtos;

// --- Requests ---------------------------------------------------------------

// POST /api/identity/verify  (snake_case body, as specified)
public record VerifyIdentityRequest(
    [property: JsonPropertyName("id_number")] string IdNumber,
    [property: JsonPropertyName("full_name")] string FullName);

// POST /api/transactions/payment-in
public record PaymentInRequest(Guid UserId, long AmountCents, string? Source);

// POST /api/transactions/cash-log
public record CashLogRequest(Guid UserId, long AmountCents);

// POST /api/transactions/transfer
public record TransferRequest(Guid FromUserId, Guid ToUserId, long AmountCents);

// --- Responses --------------------------------------------------------------

public record VerifyIdentityResponse(
    [property: JsonPropertyName("user_id")] Guid UserId,
    [property: JsonPropertyName("full_name")] string FullName,
    [property: JsonPropertyName("verified")] bool Verified);
