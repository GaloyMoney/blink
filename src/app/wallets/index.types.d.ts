type AddInvoiceForSelfArgs = {
  walletId: string
  amount: number
  memo?: string
}

type AddInvoiceArgs = {
  walletInvoiceCreateFn: (args: WalletInvoiceFactoryArgs) => WalletInvoice
  amount: number
  memo?: string
  descriptionHash?: string
}

type AddInvoiceNoAmountForSelfArgs = {
  walletId: string
  memo?: string
}

type AddInvoiceForRecipientArgs = {
  recipientWalletId: string
  amount: number
  memo?: string
  descriptionHash?: string
}

type AddInvoiceNoAmountForRecipientArgs = {
  recipientWalletId: string
  memo?: string
}

type GetOnChainFeeArgs = {
  wallet: Wallet
  amount: Satoshis
  address: OnChainAddress
  targetConfirmations: TargetConfirmations
}

type GetOnChainFeeByWalletIdArgs = {
  walletId: WalletId
  amount: number
  address: OnChainAddress
  targetConfirmations: number
}

type PaymentSendArgs = {
  senderWalletId: WalletId
  senderAccount: Account
  memo: string | null
  logger: Logger
}

type PayInvoiceByWalletIdArgs = PaymentSendArgs & {
  paymentRequest: EncodedPaymentRequest
  senderAccount: Account
}
type PayInvoiceByWalletIdWithTwoFAArgs = PayInvoiceByWalletIdArgs & {
  twoFAToken: TwoFAToken
}

type PayNoAmountInvoiceByWalletIdArgs = PaymentSendArgs & {
  paymentRequest: EncodedPaymentRequest
  amount: number
  senderAccount: Account
}
type PayNoAmountInvoiceByWalletIdWithTwoFAArgs = PayNoAmountInvoiceByWalletIdArgs & {
  twoFAToken: TwoFAToken
}

type IntraLedgerPaymentSendUsernameArgs = PaymentSendArgs & {
  recipientUsername: Username
  amount: Satoshis
}

type IntraLedgerPaymentSendWalletIdArgs = PaymentSendArgs & {
  recipientWalletId: WalletId
  amount: Satoshis
}

type IntraLedgerPaymentSendWithTwoFAArgs = IntraLedgerPaymentSendUsernameArgs & {
  twoFAToken: TwoFAToken
}

type PayOnChainByWalletIdArgs = {
  senderAccount: Account
  senderWalletId: WalletId
  amount: number
  address: string
  targetConfirmations: number
  memo: string | null
  sendAll: boolean
}

type PayOnChainByWalletIdWithTwoFAArgs = PayOnChainByWalletIdArgs & {
  twoFAToken: TwoFAToken
}
