type addInvoiceByWalletIdArgs = {
  walletId: WalletId
  amount: number
  memo?: string
}

type AddInvoiceArgs = {
  walletId: WalletId
  amount: number
  memo?: string
}

type AddInvoiceNoAmountByWalletIdArgs = {
  walletId: WalletId
  memo?: string
}

type AddInvoiceNoAmountArgs = {
  walletId: WalletId
  memo?: string
}

type AddInvoiceForRecipientArgs = {
  recipientWalletId: WalletId
  amount: number
  memo?: string
  descriptionHash?: string
}

type AddInvoiceNoAmountForRecipientArgs = {
  recipientWalletId: WalletId
  memo?: string
}

type GetOnChainFeeArgs = {
  wallet: Wallet
  amount: Satoshis
  address: OnChainAddress
  targetConfirmations: TargetConfirmations
}

// FIXME: only use for v1
type GetOnChainFeeByWalletIdArgs = {
  walletId: WalletId
  amount: number
  address: OnChainAddress
  targetConfirmations: number
}

type PaymentSendArgs = {
  payerWalletId: WalletId
  payerUserId: UserId
  memo: string | null
  logger: Logger
}

type PayLnInvoiceByWalletIdArgs = {
  walletId: WalletId
  paymentRequest: EncodedPaymentRequest
  memo: string | null
  payerUserId: UserId
  logger: Logger
}

type payLnNoAmountInvoiceByWalletIdArgs = {
  walletId: WalletId
  paymentRequest: EncodedPaymentRequest
  amount: Satoshis
  memo: string | null
  payerUserId: UserId
  logger: Logger
}

type LnInvoicePaymentSendArgs = PaymentSendArgs & {
  paymentRequest: EncodedPaymentRequest
}
type LnInvoicePaymentSendWithTwoFAArgs = LnInvoicePaymentSendArgs & {
  twoFAToken: TwoFAToken
}

type LnNoAmountInvoicePaymentSendArgs = PaymentSendArgs & {
  paymentRequest: EncodedPaymentRequest
  amount: Satoshis
}
type LnNoAmountInvoicePaymentSendWithTwoFAArgs = LnNoAmountInvoicePaymentSendArgs & {
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
