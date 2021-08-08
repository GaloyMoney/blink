type RepositoryErrorType = "RepositoryError"
type RepositoryError = ErrorWithMessage<RepositoryErrorType>

declare const walletIdSymbol: unique symbol
type WalletId = string & { [walletIdSymbol]: never }

type WalletInvoice = {
  paymentHash: PaymentHash
  walletId: WalletId
  selfGenerated: boolean
  pubkey: Pubkey
  paid: boolean
}

interface IInvoices {
  persist: (invoice: WalletInvoice) => ResultAsync<WalletInvoice, RepositoryError>
}
