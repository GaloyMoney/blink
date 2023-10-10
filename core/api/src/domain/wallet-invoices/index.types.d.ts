type BtcFromUsdFn = (
  amount: UsdPaymentAmount,
) => Promise<BtcPaymentAmount | DealerPriceServiceError>

type UsdFromBtcFn = (
  amount: BtcPaymentAmount,
) => Promise<UsdPaymentAmount | DealerPriceServiceError>

type WalletInvoiceChecker = {
  shouldDecline: () => boolean
}

type WalletInvoiceBuilderConfig = {
  dealerBtcFromUsd: BtcFromUsdFn
  dealerUsdFromBtc: UsdFromBtcFn
  lnRegisterInvoice: (
    args: NewRegisterInvoiceArgs,
  ) => Promise<RegisteredInvoice | LightningServiceError>
}

type WalletInvoiceBuilder = {
  withDescription: ({
    description,
    descriptionHash,
  }: {
    description: string
    descriptionHash?: string
  }) => WIBWithDescription
}

type WIBWithDescriptionState = WalletInvoiceBuilderConfig & {
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

type LnAndWalletInvoice = {
  walletInvoice: WalletInvoice & { paymentRequest: EncodedPaymentRequest }
  lnInvoice: LnInvoice
}

type WIBWithAmount = {
  registerInvoice: () => Promise<LnAndWalletInvoice | LightningServiceError>
}

type WalletInvoice = {
  paymentHash: PaymentHash
  secret: SecretPreImage
  selfGenerated: boolean
  pubkey: Pubkey
  usdAmount?: UsdPaymentAmount
  recipientWalletDescriptor: PartialWalletDescriptor<WalletCurrency>
  paid: boolean
  createdAt: Date
  paymentRequest?: EncodedPaymentRequest
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

  walletInvoice: WalletInvoice
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

type WalletInvoicesPersistNewArgs = Omit<WalletInvoice, "createdAt"> & {
  paymentRequest: EncodedPaymentRequest
}

interface IWalletInvoicesRepository {
  persistNew: (
    invoice: WalletInvoicesPersistNewArgs,
  ) => Promise<WalletInvoice | RepositoryError>

  markAsPaid: (paymentHash: PaymentHash) => Promise<WalletInvoice | RepositoryError>

  findByPaymentHash: (
    paymentHash: PaymentHash,
  ) => Promise<WalletInvoice | RepositoryError>

  yieldPending: () => AsyncGenerator<WalletInvoice> | RepositoryError

  deleteByPaymentHash: (paymentHash: PaymentHash) => Promise<boolean | RepositoryError>

  deleteUnpaidOlderThan: (before: Date) => Promise<number | RepositoryError>
}
