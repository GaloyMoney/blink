type BtcFromUsdFn = (
  amount: UsdPaymentAmount,
) => Promise<BtcPaymentAmount | DealerPriceServiceError>

type UsdFromBtcFn = (
  amount: BtcPaymentAmount,
) => Promise<UsdPaymentAmount | DealerPriceServiceError>

type WalletInvoiceChecker = {
  shouldDecline: () => boolean
}

type WalletInvoiceStatus =
  (typeof import("./index").WalletInvoiceStatus)[keyof typeof import("./index").WalletInvoiceStatus]

type WalletInvoiceStatusChecker = {
  status: (currentTime: Date) => WalletInvoiceStatus
}

type WalletInvoiceBuilderConfig = {
  dealerBtcFromUsd: BtcFromUsdFn
  dealerUsdFromBtc: UsdFromBtcFn
  lnRegisterInvoice: (
    args: RegisterInvoiceArgs,
  ) => Promise<RegisteredInvoice | LightningServiceError>
}

type WalletInvoiceBuilder = {
  withExternalId: (externalId: LedgerExternalId | undefined) => WIBWithExternalId
}

type WIBWithExternalIdState = WalletInvoiceBuilderConfig & {
  externalId: LedgerExternalId | undefined
}

type WIBWithExternalId = {
  withDescription: ({
    description,
    descriptionHash,
  }: {
    description: string
    descriptionHash?: string
  }) => WIBWithDescription
}

type WIBWithDescriptionState = WIBWithExternalIdState & {
  description: string
  descriptionHash?: string
}

type WIBWithDescription = {
  generatedForSelf: () => WIBWithOrigin
  generatedForRecipient: () => WIBWithOrigin
}

type WIBWithOriginState = WIBWithDescriptionState & {
  selfGenerated: boolean
}

type WIBWithOrigin = {
  withRecipientWallet: (
    recipientWallet: WalletDescriptor<WalletCurrency>,
  ) => WIBWithRecipient
}

type WIBWithRecipientState = WIBWithOriginState & {
  recipientWalletDescriptor: WalletDescriptor<WalletCurrency>
}

type WIBWithRecipient = {
  withExpiration: (minutes: Minutes) => WIBWithExpiration
}

type WIBWithExpirationState = WIBWithRecipientState & {
  invoiceExpiration: InvoiceExpiration
}

type WIBWithExpiration = {
  withAmount: (
    amount: PaymentAmount<WalletCurrency>,
  ) => Promise<WIBWithAmount | ValidationError | DealerPriceServiceError>
  withoutAmount: () => Promise<WIBWithAmount>
}

type WIBWithAmountState = WIBWithExpirationState & {
  hasAmount: boolean
  btcAmount: BtcPaymentAmount
  usdAmount?: UsdPaymentAmount
}

type WIBWithAmount = {
  registerInvoice: () => Promise<WalletInvoice | LightningServiceError>
}

type WalletInvoiceWithOptionalLnInvoice = {
  paymentHash: PaymentHash
  secret: SecretPreImage
  selfGenerated: boolean
  pubkey: Pubkey
  usdAmount?: UsdPaymentAmount
  recipientWalletDescriptor: WalletDescriptor<WalletCurrency>
  paid: boolean
  createdAt: Date
  processingCompleted: boolean
  externalId: LedgerExternalId
  lnInvoice?: LnInvoice // LnInvoice is optional because some older invoices don't have it
}

type WalletInvoice = WalletInvoiceWithOptionalLnInvoice & {
  lnInvoice: LnInvoice
}

type WalletAddress<S extends WalletCurrency> = {
  address: OnChainAddress
  recipientWalletDescriptor: WalletDescriptor<S>
}

type WalletInvoiceConversionFns = {
  usdFromBtc(
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError>
}

type WalletInvoiceWithConversionArgs = {
  hedgeBuyUsd: WalletInvoiceConversionFns
  mid: WalletInvoiceConversionFns
}

type WalletInvoiceReceiver = {
  withConversion(
    args: WalletInvoiceWithConversionArgs,
  ): Promise<ReceivedWalletInvoice | ValidationError | DealerPriceServiceError>
}

type ReceivedWalletInvoice = {
  usdToCreditReceiver: UsdPaymentAmount
  btcToCreditReceiver: BtcPaymentAmount
  usdBankFee: UsdPaymentAmount
  btcBankFee: BtcPaymentAmount
  recipientWalletDescriptor: WalletDescriptor<WalletCurrency>
  receivedAmount: () => BtcPaymentAmount | UsdPaymentAmount
}

type WalletAddressReceiver = {
  usdToCreditReceiver: UsdPaymentAmount
  btcToCreditReceiver: BtcPaymentAmount
  usdBankFee: UsdPaymentAmount
  btcBankFee: BtcPaymentAmount
  receivedAmount: () => BtcPaymentAmount | UsdPaymentAmount
  settlementAmounts: () =>
    | { amountToCreditReceiver: BtcPaymentAmount; bankFee: BtcPaymentAmount }
    | { amountToCreditReceiver: UsdPaymentAmount; bankFee: UsdPaymentAmount }
}

type WalletInvoiceReceiverArgs = {
  receivedBtc: BtcPaymentAmount
  satsFee?: BtcPaymentAmount

  walletInvoice: WalletInvoiceWithOptionalLnInvoice
  recipientWalletDescriptors: AccountWalletDescriptors
}

type WalletAddressReceiverArgs<S extends WalletCurrency> = {
  receivedBtc: BtcPaymentAmount
  satsFee?: BtcPaymentAmount
  usdFromBtc(
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError>
  usdFromBtcMidPrice(
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError>

  walletAddress: WalletAddress<S>
}

type WalletInvoicesPersistNewArgs = Omit<WalletInvoice, "createdAt">

type WalletInvoiceFindForWalletByPaymentHashArgs = {
  walletId: WalletId
  paymentHash: PaymentHash
}

interface IWalletInvoicesRepository {
  persistNew: (
    invoice: WalletInvoicesPersistNewArgs,
  ) => Promise<WalletInvoice | RepositoryError>

  markAsPaid: (
    paymentHash: PaymentHash,
  ) => Promise<WalletInvoiceWithOptionalLnInvoice | RepositoryError>

  findInvoicesForWallets: (args: {
    walletIds: WalletId[]
    paginationArgs: PaginatedQueryArgs
  }) => Promise<PaginatedQueryResult<WalletInvoice> | RepositoryError>

  findByPaymentHash: (
    paymentHash: PaymentHash,
  ) => Promise<WalletInvoice | RepositoryError>

  findForWalletByPaymentHash: (
    args: WalletInvoiceFindForWalletByPaymentHashArgs,
  ) => Promise<WalletInvoice | RepositoryError>

  yieldPending: () => AsyncGenerator<WalletInvoiceWithOptionalLnInvoice> | RepositoryError

  markAsProcessingCompleted: (
    paymentHash: PaymentHash,
  ) => Promise<WalletInvoiceWithOptionalLnInvoice | RepositoryError>
}
