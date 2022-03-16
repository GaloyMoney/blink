type PaymentFlowState<S extends WalletCurrency, R extends WalletCurrency> = {
  senderWalletId: WalletId
  senderWalletCurrency: S
  settlementMethod: SettlementMethod
  paymentInitiationMethod: PaymentInitiationMethod
  paymentHash: PaymentHash

  btcPaymentAmount: BtcPaymentAmount
  usdPaymentAmount: UsdPaymentAmount
  inputAmount: BigInt

  btcProtocolFee: BtcPaymentAmount
  usdProtocolFee: UsdPaymentAmount

  recipientWalletId?: WalletId
  recipientWalletCurrency?: R

  outgoingNodePubkey?: Pubkey
  cachedRoute?: RawRoute
}

type PaymentFlow<S extends WalletCurrency, R extends WalletCurrency> = PaymentFlowState<
  S,
  R
> & {
  protocolFeeInSenderWalletCurrency(): PaymentAmount<S>
  protocolFeeInBtc(): BtcPaymentAmount
  paymentAmountInSenderWalletCurrency(): PaymentAmount<S>
  paymentAmountInBtc(): BtcPaymentAmount
  paymentAmountInUsd(): UsdPaymentAmount
  routeFromCachedRoute(): {
    rawRoute?: RawRoute
    outgoingNodePubkey?: Pubkey
  }
}

type LightningPaymentFlowBuilder<S extends WalletCurrency> = {
  withInvoice(invoice: LnInvoice): LPFBWithInvoice<S> | LPFBWithError
  withNoAmountInvoice({
    invoice,
    uncheckedAmount,
  }: {
    invoice: LnInvoice
    uncheckedAmount: number
  }): LPFBWithInvoice<S> | LPFBWithError
}

type LPFBWithInvoice<S extends WalletCurrency> = {
  withSenderWallet(
    senderWallet: WalletDescriptor<S>,
  ): LPFBWithSenderWallet<S> | LPFBWithError
}

type LPFBWithSenderWallet<S extends WalletCurrency> = {
  isIntraLedger(): boolean
  withoutRecipientWallet<R extends WalletCurrency>():
    | LPFBWithRecipientWallet<S, R>
    | LPFBWithError
  withRecipientWallet<R extends WalletCurrency>({
    id: recipientWalletId,
    currency: recipientWalletCurrency,
    usdPaymentAmount,
  }: WalletDescriptor<R> & {
    usdPaymentAmount?: UsdPaymentAmount
  }): LPFBWithRecipientWallet<S, R> | LPFBWithError
}

type LPFBWithRecipientWallet<S extends WalletCurrency, R extends WalletCurrency> = {
  withConversion({
    usdFromBtc,
    btcFromUsd,
  }: {
    usdFromBtc(
      amount: BtcPaymentAmount,
    ): Promise<UsdPaymentAmount | DealerPriceServiceError>
    btcFromUsd(
      amount: UsdPaymentAmount,
    ): Promise<BtcPaymentAmount | DealerPriceServiceError>
  }): LPFBWithConversion<S, R> | LPFBWithError
}

type LPFBWithConversion<S extends WalletCurrency, R extends WalletCurrency> = {
  withRoute({
    pubkey,
    rawRoute,
  }: {
    pubkey: Pubkey
    rawRoute: RawRoute
  }): Promise<PaymentFlow<S, R> | ValidationError | DealerPriceServiceError>
  withoutRoute(): Promise<PaymentFlow<S, R> | ValidationError | DealerPriceServiceError>

  btcPaymentAmount(): Promise<BtcPaymentAmount | DealerPriceServiceError>
  usdPaymentAmount(): Promise<UsdPaymentAmount | DealerPriceServiceError>

  needsRoute(): Promise<boolean | DealerPriceServiceError>
}

type LPFBTest = {
  withSenderWallet(): LPFBTest
}

type LPFBWithError = {
  withSenderWallet(): LPFBWithError
  withoutRecipientWallet(): LPFBWithError
  withRecipientWallet(): LPFBWithError
  withConversion(): LPFBWithError
  isIntraLedger(): DealerPriceServiceError | ValidationError
  withRoute(): Promise<ValidationError | DealerPriceServiceError>
  withoutRoute(): Promise<ValidationError | DealerPriceServiceError>
  btcPaymentAmount(): Promise<ValidationError | DealerPriceServiceError>
  usdPaymentAmount(): Promise<ValidationError | DealerPriceServiceError>
  needsRoute(): Promise<boolean | ValidationError | DealerPriceServiceError>
}
interface IPaymentFlowRepository {
  persistNew<S extends WalletCurrency>(
    payment: PaymentFlow<S, WalletCurrency>,
  ): Promise<PaymentFlow<S, WalletCurrency> | RepositoryError>
  findLightningPaymentFlow<S extends WalletCurrency>({
    walletId,
    paymentHash,
    inputAmount,
  }: {
    walletId: WalletId
    paymentHash: PaymentHash
    inputAmount: BigInt
  }): Promise<PaymentFlow<S, WalletCurrency> | RepositoryError>
}

type UsdFromBtcMidPriceFn = (
  amount: BtcPaymentAmount,
) => Promise<UsdPaymentAmount | DealerPriceServiceError>

type BtcFromUsdMidPriceFn = (
  amount: UsdPaymentAmount,
) => Promise<BtcPaymentAmount | DealerPriceServiceError>

type LightningPaymentFlowBuilderConfig = {
  localNodeIds: Pubkey[]
  usdFromBtcMidPriceFn: UsdFromBtcMidPriceFn
  btcFromUsdMidPriceFn: BtcFromUsdMidPriceFn
}

type LPFBWithInvoiceState = LightningPaymentFlowBuilderConfig & {
  paymentHash: PaymentHash
  settlementMethod: SettlementMethod
  btcPaymentAmount?: BtcPaymentAmount
  inputAmount?: BigInt
  uncheckedAmount?: number
  btcProtocolFee?: BtcPaymentAmount
  usdProtocolFee?: UsdPaymentAmount
}

type LPFBWithSenderWalletState<S extends WalletCurrency> = RequireField<
  LPFBWithInvoiceState,
  "inputAmount"
> & {
  senderWalletId: WalletId
  senderWalletCurrency: S
  usdPaymentAmount?: UsdPaymentAmount
}

type LPFBWithRecipientWalletState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = LPFBWithSenderWalletState<S> & {
  recipientWalletId?: WalletId
  recipientWalletCurrency?: R
}

type LPFBWithConversionState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = RequireField<
  LPFBWithRecipientWalletState<S, R>,
  "btcPaymentAmount" | "btcProtocolFee" | "usdProtocolFee" | "usdPaymentAmount"
>
