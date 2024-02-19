type AddInvoiceForSelfArgs = {
  walletId: WalletId
  walletAmount: PaymentAmount<WalletCurrency>
  memo?: string
  expiresIn: Minutes
}

type AddInvoiceForSelfForBtcWalletArgs = {
  walletId: string
  amount: number
  memo?: string
  expiresIn?: number
}

type AddInvoiceForSelfForUsdWalletArgs = AddInvoiceForSelfForBtcWalletArgs

type AddInvoiceNoAmountForSelfArgs = {
  walletId: string
  memo?: string
  expiresIn?: number
}

type AddInvoiceForRecipientArgs = {
  recipientWalletId: WalletId
  walletAmount: PaymentAmount<WalletCurrency>
  memo?: string
  descriptionHash?: string
  expiresIn: Minutes
}

type AddInvoiceForRecipientForBtcWalletArgs = {
  recipientWalletId: string
  amount: number
  memo?: string
  descriptionHash?: string
  expiresIn?: number
}

type AddInvoiceForRecipientForUsdWalletArgs = AddInvoiceForRecipientForBtcWalletArgs

type AddInvoiceNoAmountForRecipientArgs = {
  recipientWalletId: string
  memo?: string
  expiresIn?: number
}

type BuildWIBWithAmountFnArgs = {
  walletInvoiceBuilder: WalletInvoiceBuilder
  recipientWalletDescriptor: WalletDescriptor<WalletCurrency>
}

type AddInvoiceArgs = {
  walletId: WalletId
  limitCheckFn: (accountId: AccountId) => Promise<true | RateLimitServiceError>
  buildWIBWithAmountFn: (
    buildWIBWithAmountFnArgs: BuildWIBWithAmountFnArgs,
  ) => Promise<ValidationError | DealerPriceServiceError | WIBWithAmount>
}

type GetOnChainFeeWithoutCurrencyArgs = {
  walletId: WalletId
  account: Account
  amount: number
  address: OnChainAddress
  speed: PayoutSpeed
}

type GetOnChainFeeArgs = GetOnChainFeeWithoutCurrencyArgs & {
  amountCurrency: WalletCurrency
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

type PayNoAmountInvoiceByWalletIdArgs = PaymentSendArgs & {
  uncheckedPaymentRequest: string
  amount: number
  senderAccount: Account
}

type IntraLedgerPaymentSendUsernameArgs = PaymentSendArgs & {
  recipientUsername: Username
  amount: Satoshis
}

type IntraLedgerPaymentSendWalletIdArgs = PaymentSendArgs & {
  recipientWalletId: WalletId
  amount: number
}

type PayAllOnChainByWalletIdArgs = {
  senderWalletId: WalletId
  senderAccount: Account
  address: string
  speed: PayoutSpeed
  memo: string | null
}

type PayOnChainByWalletIdWithoutCurrencyArgs = {
  senderWalletId: WalletId
  senderAccount: Account
  amount: number
  address: string
  speed: PayoutSpeed
  memo: string | null
}

type PayOnChainByWalletIdArgs = PayOnChainByWalletIdWithoutCurrencyArgs & {
  amountCurrency: WalletCurrency | undefined
  sendAll: boolean
}

type LnAddressPaymentSendArgs = {
  senderWalletId: WalletId
  senderAccount: Account
  lnAddress: string
  amount: number
}

type LnurlPaymentSendArgs = {
  senderWalletId: WalletId
  senderAccount: Account
  lnurl: string
  amount: number
}

type ProcessedReason =
  (typeof import("./process-pending-invoice-result").ProcessedReason)[keyof typeof import("./process-pending-invoice-result").ProcessedReason]

type ProcessPendingInvoiceResultState =
  | {
      markProcessedAndPaid: true
    }
  | {
      markProcessedAndPaid: true
      error?: ApplicationError
    }
  | {
      markProcessedOnly: true
      markProcessedAndPaid: false
      reason: ProcessedReason
    }
  | {
      markProcessedOnly: false
      markProcessedAndPaid: false
      error?: ApplicationError
    }

type ProcessPendingInvoiceResult = {
  markProcessedOnly: () => boolean
  markProcessedAndPaid: () => boolean
  error: () => boolean | ApplicationError
}
