type AddInvoiceForSelfArgs = {
  walletId: string
  amount: number
  memo?: string
}

type AddInvoiceArgs = {
  walletInvoiceCreateFn: (args: WalletInvoiceFactoryArgs) => WalletInvoice
  amount: number
  memo?: string
  descriptionHash?: string,
}

type AddInvoiceNoAmountForSelfArgs = {
  walletId: string
  memo?: string
}

type Callback = {
  url: string
  state: string
}

type AddInvoiceForRecipientArgs = {
  recipientWalletId: string
  amount: number
  memo?: string
  descriptionHash?: string,
  callback?: {
    url: string,
    state: string
  }
}

type AddInvoiceNoAmountForRecipientArgs = {
  recipientWalletId: string
  memo?: string
}

type GetOnChainFeeArgs = {
  walletId: WalletId
  account: Account
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
  amount: number
}

type IntraLedgerPaymentSendWithTwoFAArgs = IntraLedgerPaymentSendUsernameArgs & {
  twoFAToken: TwoFAToken
}

type PayOnChainByWalletIdArgs = {
  senderWalletId: WalletId
  senderAccount: Account
  amount: number
  address: string
  targetConfirmations: number
  memo: string | null
  sendAll: boolean
}

type PayOnChainByWalletIdWithTwoFAArgs = PayOnChainByWalletIdArgs & {
  twoFAToken: TwoFAToken
}
