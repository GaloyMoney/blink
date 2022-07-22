type PriceRatio = {
  convertFromUsd(convert: UsdPaymentAmount): BtcPaymentAmount
  convertFromBtc(convert: BtcPaymentAmount): UsdPaymentAmount
  convertFromBtcToFloor(convert: BtcPaymentAmount): UsdPaymentAmount
  convertFromBtcToCeil(convert: BtcPaymentAmount): UsdPaymentAmount
  usdPerSat(): DisplayCurrencyBasePerSat
}

type XorPaymentHashProperty = XOR<
  { paymentHash: PaymentHash },
  { intraLedgerHash: IntraLedgerHash }
>

type PaymentFlowState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = XorPaymentHashProperty & {
  senderWalletId: WalletId
  senderWalletCurrency: S
  settlementMethod: SettlementMethod
  paymentInitiationMethod: PaymentInitiationMethod
  descriptionFromInvoice: string
  createdAt: Date
  paymentSentAndPending: boolean

  btcPaymentAmount: BtcPaymentAmount
  usdPaymentAmount: UsdPaymentAmount
  inputAmount: bigint

  btcProtocolFee: BtcPaymentAmount
  usdProtocolFee: UsdPaymentAmount

  recipientWalletId?: WalletId
  recipientWalletCurrency?: R
  recipientPubkey?: Pubkey
  recipientUsername?: Username

  outgoingNodePubkey?: Pubkey
  cachedRoute?: RawRoute
}

type PaymentFlowStateIndex = XorPaymentHashProperty & {
  walletId: WalletId
  inputAmount: bigint
}

type PaymentFlow<S extends WalletCurrency, R extends WalletCurrency> = PaymentFlowState<
  S,
  R
> & {
  protocolFeeInSenderWalletCurrency(): PaymentAmount<S>
  paymentAmounts(): { btc: BtcPaymentAmount; usd: UsdPaymentAmount }
  totalAmountsForPayment(): { btc: BtcPaymentAmount; usd: UsdPaymentAmount }
  routeDetails(): {
    rawRoute?: RawRoute
    outgoingNodePubkey?: Pubkey
  }
  recipientDetails(): {
    recipientWalletId: WalletId | undefined
    recipientWalletCurrency: WalletCurrency | undefined
    recipientPubkey: Pubkey | undefined
    recipientUsername: Username | undefined
  }
  senderWalletDescriptor(): WalletDescriptor<S>
  recipientWalletDescriptor(): WalletDescriptor<R> | undefined
  checkBalanceForSend(balanceAmount: BalanceAmount<S>): true | ValidationError
  paymentHashForFlow(): PaymentHash | ValidationError
  intraLedgerHashForFlow(): IntraLedgerHash | ValidationError
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
  withoutInvoice({
    uncheckedAmount,
    description,
  }: {
    uncheckedAmount: number
    description: string
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

  isIntraLedger(): Promise<boolean | DealerPriceServiceError>
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
  btcPaymentAmount(): Promise<ValidationError | DealerPriceServiceError>
  usdPaymentAmount(): Promise<ValidationError | DealerPriceServiceError>
  isIntraLedger(): Promise<ValidationError | DealerPriceServiceError>
}
interface IPaymentFlowRepository {
  persistNew<S extends WalletCurrency>(
    payment: PaymentFlow<S, WalletCurrency>,
  ): Promise<PaymentFlow<S, WalletCurrency> | RepositoryError>
  findLightningPaymentFlow<S extends WalletCurrency, R extends WalletCurrency>(
    paymentFlowIndex: PaymentFlowStateIndex,
  ): Promise<PaymentFlow<S, R> | RepositoryError>
  updateLightningPaymentFlow<S extends WalletCurrency>(
    paymentFlow: PaymentFlow<S, WalletCurrency>,
  ): Promise<true | RepositoryError>
  markLightningPaymentFlowNotPending<S extends WalletCurrency>(
    paymentFlowIndex: PaymentFlowStateIndex,
  ): Promise<PaymentFlow<S, WalletCurrency> | RepositoryError>
  deleteExpiredLightningPaymentFlows(): Promise<number | RepositoryError>
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

type LPFBWithInvoiceState = LightningPaymentFlowBuilderConfig &
  XorPaymentHashProperty & {
    settlementMethod: SettlementMethod
    paymentInitiationMethod: PaymentInitiationMethod
    descriptionFromInvoice: string
    btcPaymentAmount?: BtcPaymentAmount
    inputAmount?: bigint
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
  recipientPubkey?: Pubkey
  recipientUsername?: Username
}

type LPFBWithConversionState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = RequireField<
  LPFBWithRecipientWalletState<S, R>,
  "btcPaymentAmount" | "btcProtocolFee" | "usdProtocolFee" | "usdPaymentAmount"
> & { createdAt: Date }

type LPFBWithRouteState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = LPFBWithConversionState<S, R> & {
  outgoingNodePubkey: Pubkey | undefined
  checkedRoute: RawRoute | undefined
}
