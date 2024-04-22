type AddInvoiceForSelfArgs = {
  walletId: WalletId
  walletAmount: PaymentAmount<WalletCurrency>
  memo?: string
  expiresIn: Minutes
  externalId: LedgerExternalId | undefined
}

type AddInvoiceForSelfForBtcWalletArgs = {
  walletId: string
  amount: number
  memo?: string
  expiresIn?: number
  externalId: string | undefined
}

type AddInvoiceForSelfForUsdWalletArgs = AddInvoiceForSelfForBtcWalletArgs

type AddInvoiceNoAmountForSelfArgs = {
  walletId: WalletId
  memo?: string
  expiresIn: Minutes
  externalId: LedgerExternalId | undefined
}

type AddInvoiceNoAmountForSelfForAnyWalletArgs = {
  walletId: string
  memo?: string
  expiresIn?: number
  externalId: string | undefined
}

type AddInvoiceForRecipientArgs = {
  recipientWalletId: WalletId
  walletAmount: PaymentAmount<WalletCurrency>
  memo?: string
  descriptionHash?: string
  expiresIn: Minutes
  externalId: LedgerExternalId | undefined
}

type AddInvoiceForRecipientForBtcWalletArgs = {
  recipientWalletId: string
  amount: number
  memo?: string
  descriptionHash?: string
  expiresIn?: number
  externalId: string | undefined
}

type AddInvoiceForRecipientForUsdWalletArgs = AddInvoiceForRecipientForBtcWalletArgs

type AddInvoiceNoAmountForRecipientArgs = {
  recipientWalletId: WalletId
  memo?: string
  expiresIn: Minutes
  externalId: LedgerExternalId | undefined
}

type AddInvoiceNoAmountForRecipientForAnyWalletArgs = {
  recipientWalletId: string
  memo?: string
  expiresIn?: number
  externalId: string | undefined
}

type CancelInvoiceForWalletArgs = {
  walletId: WalletId
  paymentHash: PaymentHash
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

type ProcessPendingInvoiceResultType =
  (typeof import("./process-pending-invoice-result").ProcessPendingInvoiceResultType)[keyof typeof import("./process-pending-invoice-result").ProcessPendingInvoiceResultType]

type ProcessPendingInvoiceResult =
  | {
      type: "markProcessedAsPaid"
    }
  | {
      type: "markProcessedAsPaidWithError"
      error: ApplicationError
    }
  | {
      type: "markProcessedAsCanceledOrExpired"
      reason: ProcessedReason
    }
  | {
      type: "reasonInvoiceNotPaidYet"
    }
  | {
      type: "error"
      error: ApplicationError
    }
