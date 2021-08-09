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
  persist: (invoice: WalletInvoice) => Promise<WalletInvoice | RepositoryError>
  findByPaymentHash: (paymentHash: PaymentHash) => Promise<WalletInvoice | LookupError>
}
