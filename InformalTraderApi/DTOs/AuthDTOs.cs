namespace InformalTraderApi.DTOs;

// 1. INPUT DTO: Data sent from the React Frontend to Register a Trader
public class RegisterRequest
{
    public string SaId { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
}

// 2. INPUT DTO: Data sent from the React Frontend to Login
public class LoginRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty;
}

// 3. DESERIALIZATION HELPER: Parses PocketBase's array response wrapper
public class PocketBaseListResponse
{
    public List<PocketBaseTraderItem> Items { get; set; } = new();
}

// 4. DESERIALIZATION HELPER: Matches your exact PocketBase database column conventions
public class PocketBaseTraderItem
{
    public string Id { get; set; } = string.Empty; // PocketBase system record id
    public string Phone_Number { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty;
    public string Business_Name { get; set; } = string.Empty;
    public string Id_Number { get; set; } = string.Empty; // Fixed to match your custom convention
}