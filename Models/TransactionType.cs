namespace TraderWallet.Api.Models;

public enum TransactionType
{
    PaymentInQr,    // digital payment received via QR
    CashLogDaily,   // self-reported daily cash takings (not part of digital balance)
    TransferOut,    // wallet-to-wallet, money leaving
    TransferIn,     // wallet-to-wallet, money arriving
    Deposit,        // cash/bank top-up into the wallet
    Withdrawal,     // cash-out from the wallet
    LoanIn,         // loan disbursed into the wallet
    LoanRepayment   // loan repaid out of the wallet
}
