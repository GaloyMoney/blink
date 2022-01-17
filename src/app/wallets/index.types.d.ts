type addInvoiceByWalletIdArgs = {
  walletId: WalletId
  amount: number
  memo?: string
}

type AddInvoiceArgs = {
  wallet: Wallet
  amount: number
  memo?: string
}

type AddInvoiceNoAmountByWalletIdArgs = {
  walletId: WalletId
  memo?: string
}

type AddInvoiceNoAmountArgs = {
  wallet: Wallet
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
