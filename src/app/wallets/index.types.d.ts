type AddInvoiceForSelfArgs = {
  walletId: string
  amount: number
  memo?: string
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

type BuildWIBWithAmountFnArgs = {
  walletInvoiceBuilder: WalletInvoiceBuilder
  recipientWalletDescriptor: WalletDescriptor<WalletCurrency>
}

type AddInvoiceArgs = {
  walletId: string
  limitCheckFn: (accountId: AccountId) => Promise<true | RateLimitServiceError>
  buildWIBWithAmountFn: (
    buildWIBWithAmountFnArgs: BuildWIBWithAmountFnArgs,
  ) => Promise<ValidationError | DealerPriceServiceError | WIBWithAmount>
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
}

type PayInvoiceByWalletIdArgs = PaymentSendArgs & {
  uncheckedPaymentRequest: string
  senderAccount: Account
}
type PayInvoiceByWalletIdWithTwoFAArgs = PayInvoiceByWalletIdArgs & {
  twoFAToken: TwoFAToken
}

type PayNoAmountInvoiceByWalletIdArgs = PaymentSendArgs & {
  uncheckedPaymentRequest: string
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
