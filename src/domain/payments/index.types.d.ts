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
}

type LPFBTest = {
  withSenderWallet(): LPFBTest
}

type LPFBWithError = {
  withSenderWallet(): LPFBWithError
  withoutRecipientWallet(): LPFBWithError
  withRecipientWallet(): LPFBWithError
  withConversion(): LPFBWithError
  withRoute(): Promise<ValidationError | DealerPriceServiceError>
  withoutRoute(): Promise<ValidationError | DealerPriceServiceError>
  isIntraLedger(): Promise<ValidationError | DealerPriceServiceError>
  btcPaymentAmount(): Promise<ValidationError | DealerPriceServiceError>
}

type LightningPaymentFlowBuilderOld<S extends WalletCurrency> = {
  withSenderWallet(senderWallet: WalletDescriptor<S>): LightningPaymentFlowBuilderOld<S>
  withInvoice(invoice: LnInvoice): LightningPaymentFlowBuilderOld<S>
  withUncheckedAmount(amount: number): LightningPaymentFlowBuilderOld<S>
  withBtcAmount(amount: BtcPaymentAmount): LightningPaymentFlowBuilderOld<S>
  withRouteResult(routeResult: {
    pubkey: Pubkey
    rawRoute: RawRoute
  }): LightningPaymentFlowBuilderOld<S>
  needsProtocolFee(): boolean
  btcPaymentAmount(): BtcPaymentAmount | undefined
  usdPaymentAmount(): UsdPaymentAmount | undefined
  payment(): PaymentFlow<S, WalletCurrency> | ValidationError
}

type LightningPaymentBuilderState<S extends WalletCurrency> = {
  localNodeIds: Pubkey[]
  validationError?: ValidationError
  senderWalletId?: WalletId
  senderWalletCurrency?: S
  settlementMethod?: SettlementMethod
  btcProtocolFee?: BtcPaymentAmount
  usdProtocolFee?: UsdPaymentAmount

  outgoingNodePubkey?: Pubkey
  cachedRoute?: RawRoute

  btcPaymentAmount?: BtcPaymentAmount
  usdPaymentAmount?: UsdPaymentAmount
  invoice?: LnInvoice
  uncheckedAmount?: number
  inputAmount?: BigInt
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

type AmountConverterConfig = {
  dealerFns: IDealerPriceServiceNew
}
type AmountConverter = {
  addAmountsForFutureBuy<S extends WalletCurrency>(
    builder: LightningPaymentFlowBuilderOld<S>,
  ): Promise<LightningPaymentFlowBuilderOld<S> | DealerPriceServiceError>
}

type LightningPaymentFlowBuilderConfig = {
  localNodeIds: Pubkey[]
  usdFromBtcMidPriceFn(
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError>
  btcFromUsdMidPriceFn(
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError>
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
