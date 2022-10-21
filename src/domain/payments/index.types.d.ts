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

type PaymentFlowBaseState<S extends WalletCurrency, R extends WalletCurrency> = {
  senderWalletId: WalletId
  senderWalletCurrency: S
  senderAccountId: AccountId
  settlementMethod: SettlementMethod
  paymentInitiationMethod: PaymentInitiationMethod
  createdAt: Date
  paymentSentAndPending: boolean

  btcPaymentAmount: BtcPaymentAmount
  usdPaymentAmount: UsdPaymentAmount
  inputAmount: bigint

  btcProtocolFee: BtcPaymentAmount
  usdProtocolFee: UsdPaymentAmount

  recipientWalletId?: WalletId
  recipientWalletCurrency?: R
  recipientAccountId?: AccountId
  recipientPubkey?: Pubkey
  recipientUsername?: Username

  outgoingNodePubkey?: Pubkey
  cachedRoute?: RawRoute
}

type PaymentFlowState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = XorPaymentHashProperty & {
  descriptionFromInvoice: string
  skipProbeForDestination: boolean
} & PaymentFlowBaseState<S, R>

type OnChainPaymentFlowState<S extends WalletCurrency, R extends WalletCurrency> = {
  address: OnChainAddress
  btcBankFee: BtcPaymentAmount
  usdBankFee: UsdPaymentAmount
} & PaymentFlowBaseState<S, R>

type PaymentFlowStateIndex = XorPaymentHashProperty & {
  walletId: WalletId
  inputAmount: bigint
}

type PaymentFlowBase<S extends WalletCurrency, R extends WalletCurrency> = {
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
}

type PaymentFlow<S extends WalletCurrency, R extends WalletCurrency> = PaymentFlowState<
  S,
  R
> &
  PaymentFlowBase<S, R> & {
    paymentHashForFlow(): PaymentHash | ValidationError
    intraLedgerHashForFlow(): IntraLedgerHash | ValidationError
  }

type OnChainPaymentFlow<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = OnChainPaymentFlowState<S, R> &
  PaymentFlowBase<S, R> & {
    addressForFlow(): OnChainAddress | ValidationError
    bankFees(): { btc: BtcPaymentAmount; usd: UsdPaymentAmount } | ValidationError
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

type OnChainPaymentFlowBuilder<S extends WalletCurrency> = {
  withAddress(address: OnChainAddress): OPFBWithAddress<S> | OPFBWithError
}

type LPFBWithInvoice<S extends WalletCurrency> = {
  withSenderWallet(
    senderWallet: WalletDescriptor<S>,
  ): LPFBWithSenderWallet<S> | LPFBWithError
}

type OPFBWithAddress<S extends WalletCurrency> = {
  withSenderWalletAndAccount({
    wallet,
    account,
  }: {
    wallet: WalletDescriptor<S>
    account: Account
  }): OPFBWithSenderWalletAndAccount<S> | OPFBWithError
}

type LPFBWithSenderWallet<S extends WalletCurrency> = {
  isIntraLedger(): boolean
  withoutRecipientWallet<R extends WalletCurrency>():
    | LPFBWithRecipientWallet<S, R>
    | LPFBWithError
  withRecipientWallet<R extends WalletCurrency>(
    args: WalletDescriptor<R> & {
      pubkey?: Pubkey
      usdPaymentAmount?: UsdPaymentAmount
      username?: Username
    },
  ): LPFBWithRecipientWallet<S, R> | LPFBWithError
}

type ConversionFns = {
  usdFromBtc(
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError>
  btcFromUsd(
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError>
}

type WithConversionArgs = {
  hedgeBuyUsd: ConversionFns
  hedgeSellUsd: ConversionFns
  mid: ConversionFns
}

type OPFBWithSenderWalletAndAccount<S extends WalletCurrency> = {
  withoutRecipientWallet<R extends WalletCurrency>():
    | OPFBWithRecipientWallet<S, R>
    | OPFBWithError
  withRecipientWallet<R extends WalletCurrency>({
    id: recipientWalletId,
    currency: recipientWalletCurrency,
    usdPaymentAmount,
  }: WalletDescriptor<R> & {
    usdPaymentAmount?: UsdPaymentAmount
  }): OPFBWithRecipientWallet<S, R> | OPFBWithError
}

type LPFBWithRecipientWallet<S extends WalletCurrency, R extends WalletCurrency> = {
  withConversion(args: WithConversionArgs): LPFBWithConversion<S, R> | LPFBWithError
}

type OPFBWithRecipientWallet<S extends WalletCurrency, R extends WalletCurrency> = {
  withAmount(uncheckedAmount: number): OPFBWithAmount<S, R> | OPFBWithError
}

type OPFBWithAmount<S extends WalletCurrency, R extends WalletCurrency> = {
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
  }): OPFBWithConversion<S, R> | OPFBWithError
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
  skipProbeForDestination(): Promise<boolean | DealerPriceServiceError>

  isIntraLedger(): Promise<boolean | DealerPriceServiceError>
  isTradeIntraAccount(): Promise<boolean | DealerPriceServiceError>
}

type OPFBWithConversion<S extends WalletCurrency, R extends WalletCurrency> = {
  withMinerFee(
    minerFee: BtcPaymentAmount,
  ): Promise<OnChainPaymentFlow<S, R> | ValidationError | DealerPriceServiceError>
  withoutMinerFee(): Promise<
    OnChainPaymentFlow<S, R> | ValidationError | DealerPriceServiceError
  >

  btcPaymentAmount(): Promise<BtcPaymentAmount | DealerPriceServiceError>
  usdPaymentAmount(): Promise<UsdPaymentAmount | DealerPriceServiceError>
  paymentAmounts(): Promise<
    { btc: BtcPaymentAmount; usd: UsdPaymentAmount } | DealerPriceServiceError
  >

  isIntraLedger(): Promise<boolean | DealerPriceServiceError>
  addressForFlow(): Promise<OnChainAddress | DealerPriceServiceError>
  senderWalletDescriptor(): Promise<WalletDescriptor<S> | DealerPriceServiceError>
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
  skipProbeForDestination(): Promise<ValidationError | DealerPriceServiceError>
  isIntraLedger(): Promise<ValidationError | DealerPriceServiceError>
  isTradeIntraAccount(): Promise<ValidationError | DealerPriceServiceError>
}

type OPFBWithError = {
  withSenderWalletAndAccount(): OPFBWithError
  withAmount(): OPFBWithError
  withoutRecipientWallet(): OPFBWithError
  withRecipientWallet(): OPFBWithError
  withConversion(): OPFBWithError
  withMinerFee(): Promise<ValidationError | DealerPriceServiceError>
  withoutMinerFee(): Promise<ValidationError | DealerPriceServiceError>
  btcPaymentAmount(): Promise<ValidationError | DealerPriceServiceError>
  usdPaymentAmount(): Promise<ValidationError | DealerPriceServiceError>
  isIntraLedger(): Promise<ValidationError | DealerPriceServiceError>
  paymentAmounts(): Promise<ValidationError | DealerPriceServiceError>
  addressForFlow(): Promise<ValidationError | DealerPriceServiceError>
  senderWalletDescriptor(): Promise<ValidationError | DealerPriceServiceError>
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
  flaggedPubkeys: Pubkey[]
}

type OnChainPaymentFlowBuilderConfig = {
  usdFromBtcMidPriceFn: UsdFromBtcMidPriceFn
  btcFromUsdMidPriceFn: BtcFromUsdMidPriceFn
  volumeLightningFn
  volumeOnChainFn
  isExternalAddress: (address: OnChainAddress) => Promise<boolean>
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
    skipProbeForDestination: boolean
  }

type LPFBWithSenderWalletState<S extends WalletCurrency> = RequireField<
  LPFBWithInvoiceState,
  "inputAmount"
> & {
  senderWalletId: WalletId
  senderWalletCurrency: S
  senderAccountId: AccountId
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
  recipientAccountId?: AccountId
}

type LPFBWithConversionState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = RequireField<
  LPFBWithRecipientWalletState<S, R>,
  "btcPaymentAmount" | "btcProtocolFee" | "usdProtocolFee" | "usdPaymentAmount"
> & { createdAt: Date }

type OPFBWithAddressState = OnChainPaymentFlowBuilderConfig & {
  paymentInitiationMethod: PaymentInitiationMethod
  settlementMethodPromise: Promise<SettlementMethod>
  address: OnChainAddress
}

type OPFBWithSenderWalletAndAccountState<S extends WalletCurrency> =
  OPFBWithAddressState & {
    senderWalletId: WalletId
    senderWalletCurrency: S
    senderAccountId: AccountId
    senderWithdrawFee: Satoshis
  }

type OPFBWithRecipientWalletState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = OPFBWithSenderWalletAndAccountState<S> & {
  settlementMethod: SettlementMethod

  recipientWalletId?: WalletId
  recipientWalletCurrency?: R
  recipientPubkey?: Pubkey
  recipientUsername?: Username
  recipientAccountId?: AccountId
}

type OPFBWithAmountState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = OPFBWithRecipientWalletState<S, R> & {
  btcPaymentAmount?: BtcPaymentAmount
  usdPaymentAmount?: UsdPaymentAmount
} & { inputAmount: bigint }

type OPFBWithConversionState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = RequireField<OPFBWithAmountState<S, R>, "btcPaymentAmount" | "usdPaymentAmount"> & {
  createdAt: Date
}

type LPFBWithRouteState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = LPFBWithConversionState<S, R> & {
  outgoingNodePubkey: Pubkey | undefined
  checkedRoute: RawRoute | undefined
}
