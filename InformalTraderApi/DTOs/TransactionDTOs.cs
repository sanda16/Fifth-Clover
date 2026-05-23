namespace InformalTraderApi.DTOs
{

    public class QrPaymentRequest
    {
        public string TraderId { get; set; } = string.Empty; // Scanned from the QR code
        public decimal Amount { get; set; }
    }

    public class ExtractionRequest
    {
        public string TraderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public class PocketBaseTrader
    {
        public string Id { get; set; } = string.Empty;
        public decimal Omnibus_Balance { get; set; }
        public int Reward_Points { get; set; }
    }
}