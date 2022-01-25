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
  memo: string | null
  logger: Logger
}

type PayLnInvoiceByWalletIdArgs = {
  senderWalletId: WalletId
  paymentRequest: EncodedPaymentRequest
  memo: string | null
  payerAccountId: AccountId
  logger: Logger
}

type payLnNoAmountInvoiceByWalletIdArgs = {
  senderWalletId: WalletId
  paymentRequest: EncodedPaymentRequest
  amount: Satoshis
  memo: string | null
  payerAccountId: AccountId
  logger: Logger
}

type LnInvoicePaymentSendArgs = PaymentSendArgs & {
  paymentRequest: EncodedPaymentRequest
  payerAccountId: AccountId
}
type LnInvoicePaymentSendWithTwoFAArgs = LnInvoicePaymentSendArgs & {
  twoFAToken: TwoFAToken
}

type LnNoAmountInvoicePaymentSendArgs = PaymentSendArgs & {
  paymentRequest: EncodedPaymentRequest
  amount: Satoshis
  payerAccountId: AccountId
}
type LnNoAmountInvoicePaymentSendWithTwoFAArgs = LnNoAmountInvoicePaymentSendArgs & {
  twoFAToken: TwoFAToken
}

type IntraLedgerPaymentSendUsernameArgs = PaymentSendArgs & {
  payerAccountId: AccountId
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
  senderWalletId: WalletId
  amount: number
  address: string
  targetConfirmations: number
  memo: string | null
  sendAll: boolean
}

type PayOnChainByWalletIdWithTwoFAArgs = PayOnChainByWalletIdArgs & {
  payerAccountId: AccountId
  twoFAToken: TwoFAToken
}
