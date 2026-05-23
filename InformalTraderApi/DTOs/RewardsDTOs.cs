namespace InformalTraderApi.DTOs
{
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
}
