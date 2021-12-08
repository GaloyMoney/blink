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

type GetOnChainFeeByWalletIdArgs = {
  walletId: WalletId
  amount: number
  address: OnChainAddress
  targetConfirmations: number
}

type PaymentSendArgs = {
  memo: string | null
  walletId: WalletId
  userId: UserId
  logger: Logger
}

type PayLnInvoiceByWalletIdArgs = {
  walletId: WalletId
  paymentRequest: EncodedPaymentRequest
  memo: string | null
  userId: UserId
  logger: Logger
}

type payLnNoAmountInvoiceByWalletIdArgs = {
  walletId: WalletId
  paymentRequest: EncodedPaymentRequest
  amount: Satoshis
  memo: string | null
  userId: UserId
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

type IntraLedgerPaymentSendArgs = PaymentSendArgs & {
  recipientUsername: Username
  amount: Satoshis
}
type IntraLedgerPaymentSendWithTwoFAArgs = IntraLedgerPaymentSendArgs & {
  twoFAToken: TwoFAToken
}
