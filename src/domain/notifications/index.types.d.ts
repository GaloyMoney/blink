type NotificationsError = import("./errors").NotificationsError
type NotificationsServiceError = import("./errors").NotificationsServiceError

type NotificationType =
  typeof import("./index").NotificationType[keyof typeof import("./index").NotificationType]

type OnChainTxBaseArgs = {
  walletId: WalletId
  amount: Satoshis
  txHash: OnChainTxHash
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}

type OnChainTxReceivedArgs = OnChainTxBaseArgs
type OnChainTxReceivedPendingArgs = OnChainTxBaseArgs
type OnChainTxPaymentArgs = OnChainTxBaseArgs

type LnInvoicePaidBitcoinWalletArgs = {
  paymentHash: PaymentHash
  recipientWalletId: WalletId
  sats: Satoshis | bigint
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}

type LnInvoicePaidUsdWalletArgs = {
  paymentHash: PaymentHash
  recipientWalletId: WalletId
  cents: UsdCents | bigint
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}

type IntraLedgerArgs = {
  senderWalletId: WalletId
  recipientWalletId: WalletId
  amount: Satoshis
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}

type IntraLedgerPaidBitcoinWalletArgs = {
  senderWalletId: WalletId
  recipientWalletId: WalletId
  sats: Satoshis | bigint
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}

type IntraLedgerPaidUsdWalletArgs = {
  senderWalletId: WalletId
  recipientWalletId: WalletId
  cents: UsdCents | bigint
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}

type SendBalanceArgs = {
  balance: CurrencyBaseAmount
  walletCurrency: WalletCurrency
  userId: UserId
  price: DisplayCurrencyPerSat | ApplicationError
}

interface INotificationsService {
  onChainTransactionReceived(
    args: OnChainTxReceivedArgs,
  ): Promise<void | NotificationsServiceError>
  onChainTransactionReceivedPending(
    args: OnChainTxReceivedPendingArgs,
  ): Promise<void | NotificationsServiceError>
  onChainTransactionPayment(
    args: OnChainTxPaymentArgs,
  ): Promise<void | NotificationsServiceError>
  priceUpdate: (DisplayCurrencyPerSat: number) => void
  lnInvoiceBitcoinWalletPaid: (args: LnInvoicePaidBitcoinWalletArgs) => void
  lnInvoiceUsdWalletPaid: (args: LnInvoicePaidUsdWalletArgs) => void
  intraLedgerBtcWalletPaid(
    args: IntraLedgerPaidBitcoinWalletArgs,
  ): Promise<void | NotificationsServiceError>
  intraLedgerUsdWalletPaid(
    args: IntraLedgerPaidUsdWalletArgs,
  ): Promise<void | NotificationsServiceError>
  intraLedgerPaid(args: IntraLedgerArgs): Promise<void | NotificationsServiceError>
  sendBalance(args: SendBalanceArgs): Promise<void | NotImplementedError>
}
