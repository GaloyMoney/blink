type PriceRatio<S extends WalletCurrency> = {
  convertFromOther(other: bigint): PaymentAmount<S>
  convertFromWallet(btcWalletAmount: PaymentAmount<S>): bigint
  convertFromWalletToFloor(btcWalletAmount: PaymentAmount<S>): bigint
  convertFromWalletToCeil(btcWalletAmount: PaymentAmount<S>): bigint
  otherUnitPerWalletUnit(): DisplayCurrencyBasePerSat
}

type WalletPriceRatio = {
  convertFromUsd(convert: UsdPaymentAmount): BtcPaymentAmount
  convertFromBtc(convert: BtcPaymentAmount): UsdPaymentAmount
  convertFromBtcToFloor(convert: BtcPaymentAmount): UsdPaymentAmount
  convertFromBtcToCeil(convert: BtcPaymentAmount): UsdPaymentAmount
  usdPerSat(): DisplayCurrencyBasePerSat
}

type DisplayPriceRatio<S extends WalletCurrency, T extends DisplayCurrency> = {
  convertFromDisplayMinorUnit(convert: DisplayAmount<T>): PaymentAmount<S>
  convertFromWallet(convert: PaymentAmount<S>): DisplayAmount<T>
  convertFromWalletToFloor(convert: PaymentAmount<S>): DisplayAmount<T>
  convertFromWalletToCeil(convert: PaymentAmount<S>): DisplayAmount<T>
  displayMinorUnitPerWalletUnit(): DisplayCurrencyBasePerSat
  walletCurrency: S
  displayCurrency: T
}

type XorPaymentHashProperty = XOR<
  { paymentHash: PaymentHash },
  { intraLedgerHash: IntraLedgerHash }
>

type AmountsAndFees = {
  btcPaymentAmount: BtcPaymentAmount
  btcProtocolAndBankFee: BtcPaymentAmount

  usdPaymentAmount: UsdPaymentAmount
  usdProtocolAndBankFee: UsdPaymentAmount
}

type BtcAmountsAndFees = {
  btcPaymentAmount: BtcPaymentAmount
  btcProtocolAndBankFee: BtcPaymentAmount
}

type UsdAmountsAndFees = {
  usdPaymentAmount: UsdPaymentAmount
  usdProtocolAndBankFee: UsdPaymentAmount
}

type PaymentFlowCommonState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = AmountsAndFees & {
  senderWalletId: WalletId
  senderWalletCurrency: S
  senderAccountId: AccountId
  settlementMethod: SettlementMethod
  paymentInitiationMethod: PaymentInitiationMethod
  createdAt: Date
  paymentSentAndPending: boolean

  inputAmount: bigint

  recipientWalletId?: WalletId
  recipientWalletCurrency?: R
  recipientAccountId?: AccountId
  recipientPubkey?: Pubkey
  recipientUsername?: Username
  recipientUserId?: UserId

  outgoingNodePubkey?: Pubkey
  cachedRoute?: RawRoute
}

type PaymentFlowState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = XorPaymentHashProperty & {
  descriptionFromInvoice: string
  skipProbeForDestination: boolean
} & PaymentFlowCommonState<S, R>

type OnChainPaymentFlowState<S extends WalletCurrency, R extends WalletCurrency> = {
  address: OnChainAddress
  btcBankFee: BtcPaymentAmount
  usdBankFee: UsdPaymentAmount
  btcMinerFee?: BtcPaymentAmount
} & PaymentFlowCommonState<S, R>

type PaymentFlowStateIndex = XorPaymentHashProperty & {
  walletId: WalletId
  inputAmount: bigint
}

type PaymentAmountInAllCurrencies = { btc: BtcPaymentAmount; usd: UsdPaymentAmount }

type PaymentFlowCommon<S extends WalletCurrency, R extends WalletCurrency> = {
  protocolAndBankFeeInSenderWalletCurrency(): PaymentAmount<S>
  paymentAmounts(): PaymentAmountInAllCurrencies
  totalAmountsForPayment(): PaymentAmountInAllCurrencies
  routeDetails(): {
    rawRoute?: RawRoute
    outgoingNodePubkey?: Pubkey
  }
  recipientDetails(): {
    walletDescriptor: WalletDescriptor<R> | undefined
    recipientPubkey: Pubkey | undefined
    recipientUsername: Username | undefined
    recipientUserId: UserId | undefined
  }
  senderWalletDescriptor(): WalletDescriptor<S>
  recipientWalletDescriptor(): WalletDescriptor<R> | undefined
  checkBalanceForSend(balanceAmount: BalanceAmount<S>): true | ValidationError
}

type PaymentFlow<S extends WalletCurrency, R extends WalletCurrency> = PaymentFlowState<
  S,
  R
> &
  PaymentFlowCommon<S, R> & {
    paymentHashForFlow(): PaymentHash | ValidationError
    intraLedgerHashForFlow(): IntraLedgerHash | ValidationError
  }

type OnChainPaymentFlow<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = OnChainPaymentFlowState<S, R> &
  PaymentFlowCommon<S, R> & {
    addressForFlow(): OnChainAddress | ValidationError
    bankFees(): PaymentAmountInAllCurrencies | ValidationError
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

type LPFBWithRecipientArgs<R extends WalletCurrency> = {
  defaultWalletCurrency: R
  recipientWalletDescriptors: AccountWalletDescriptors
  userId: UserId
  pubkey?: Pubkey
  usdPaymentAmount?: UsdPaymentAmount
  username?: Username
}

type LPFBWithSenderWallet<S extends WalletCurrency> = {
  isIntraLedger(): boolean
  withoutRecipientWallet<R extends WalletCurrency>():
    | LPFBWithRecipientWallet<S, R>
    | LPFBWithError
  withRecipientWallet<R extends WalletCurrency>(
    args: LPFBWithRecipientArgs<R>,
  ): LPFBWithRecipientWallet<S, R> | LPFBWithError
}

type LPFBWithRecipientWallet<S extends WalletCurrency, R extends WalletCurrency> = {
  withConversion(args: WithConversionArgs): LPFBWithConversion<S, R> | LPFBWithError
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

type LightningPaymentFlowBuilderConfig = {
  localNodeIds: Pubkey[]
  skipProbe: SkipFeeProbeConfig
}

type LPFBWithInvoiceState = LightningPaymentFlowBuilderConfig &
  XorPaymentHashProperty & {
    settlementMethod: SettlementMethod
    paymentInitiationMethod: PaymentInitiationMethod
    descriptionFromInvoice: string
    btcPaymentAmount?: BtcPaymentAmount
    inputAmount?: bigint
    uncheckedAmount?: number
    btcProtocolAndBankFee?: BtcPaymentAmount
    usdProtocolAndBankFee?: UsdPaymentAmount
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
  recipientUserId?: UserId
  recipientAccountId?: AccountId
  recipientWalletDescriptors?: AccountWalletDescriptors
}

type LPFBWithConversionState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = RequireField<
  LPFBWithRecipientWalletState<S, R>,
  | "btcPaymentAmount"
  | "btcProtocolAndBankFee"
  | "usdProtocolAndBankFee"
  | "usdPaymentAmount"
> & { createdAt: Date }

type LPFBWithRouteState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = LPFBWithConversionState<S, R> & {
  outgoingNodePubkey: Pubkey | undefined
  checkedRoute: RawRoute | undefined
}

type OnChainPaymentFlowBuilder<S extends WalletCurrency> = {
  withAddress(address: OnChainAddress): OPFBWithAddress<S> | OPFBWithError
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

type OPFBWithRecipientArgs<R extends WalletCurrency> = {
  defaultWalletCurrency: R
  recipientWalletDescriptors: AccountWalletDescriptors
  userId: UserId
  usdProposedAmount?: UsdPaymentAmount
  username?: Username
}

type OPFBWithSenderWalletAndAccount<S extends WalletCurrency> = {
  withoutRecipientWallet<R extends WalletCurrency>():
    | OPFBWithRecipientWallet<S, R>
    | OPFBWithError
  withRecipientWallet<R extends WalletCurrency>(
    args: OPFBWithRecipientArgs<R>,
  ): OPFBWithRecipientWallet<S, R> | OPFBWithError
  isIntraLedger(): Promise<boolean | DealerPriceServiceError>
}

type OPFBWithRecipientWallet<S extends WalletCurrency, R extends WalletCurrency> = {
  withAmount(amount: PaymentAmount<WalletCurrency>): OPFBWithAmount<S, R> | OPFBWithError
}

type OPFBWithAmount<S extends WalletCurrency, R extends WalletCurrency> = {
  withConversion(args: WithConversionArgs): OPFBWithConversion<S, R> | OPFBWithError
}

type OPFBWithConversion<S extends WalletCurrency, R extends WalletCurrency> = {
  withMinerFee(
    minerFee: BtcPaymentAmount,
  ): Promise<OnChainPaymentFlow<S, R> | ValidationError | DealerPriceServiceError>
  withoutMinerFee(): Promise<
    OnChainPaymentFlow<S, R> | ValidationError | DealerPriceServiceError
  >

  btcProposedAmount(): Promise<
    BtcPaymentAmount | DealerPriceServiceError | ValidationError
  >
  usdProposedAmount(): Promise<
    UsdPaymentAmount | DealerPriceServiceError | ValidationError
  >
  proposedAmounts(): Promise<
    PaymentAmountInAllCurrencies | DealerPriceServiceError | ValidationError
  >

  addressForFlow(): Promise<OnChainAddress | DealerPriceServiceError>
  senderWalletDescriptor(): Promise<WalletDescriptor<S> | DealerPriceServiceError>
}

type OPFBWithError = {
  withSenderWalletAndAccount(): OPFBWithError
  withAmount(): OPFBWithError
  withoutRecipientWallet(): OPFBWithError
  withRecipientWallet(): OPFBWithError
  withConversion(): OPFBWithError
  withMinerFee(): Promise<ValidationError | DealerPriceServiceError>
  withoutMinerFee(): Promise<ValidationError | DealerPriceServiceError>
  btcProposedAmount(): Promise<ValidationError | DealerPriceServiceError>
  usdProposedAmount(): Promise<ValidationError | DealerPriceServiceError>
  isIntraLedger(): Promise<ValidationError | DealerPriceServiceError>
  proposedAmounts(): Promise<ValidationError | DealerPriceServiceError>
  addressForFlow(): Promise<ValidationError | DealerPriceServiceError>
  senderWalletDescriptor(): Promise<ValidationError | DealerPriceServiceError>
}

type OnChainPaymentFlowBuilderConfig = {
  netInVolumeAmountLightningFn: NewGetVolumeAmountSinceFn
  netInVolumeAmountOnChainFn: NewGetVolumeAmountSinceFn
  isExternalAddress: (state: { address: OnChainAddress }) => Promise<boolean>
  sendAll: boolean
  dustThreshold: number
}

type OPFBWithAddressState = OnChainPaymentFlowBuilderConfig & {
  paymentInitiationMethod: PaymentInitiationMethod
  address: OnChainAddress
}

type OPFBWithSenderWalletAndAccountState<S extends WalletCurrency> =
  OPFBWithAddressState & {
    senderWalletId: WalletId
    senderWalletCurrency: S
    senderAccountId: AccountId
    senderWithdrawFee: Satoshis | undefined
  }

type OPFBWithRecipientWalletState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = OPFBWithSenderWalletAndAccountState<S> & {
  settlementMethod: SettlementMethod

  recipientWalletId?: WalletId
  recipientWalletCurrency?: R
  recipientUsername?: Username
  recipientUserId?: UserId
  recipientAccountId?: AccountId
  recipientWalletDescriptors?: AccountWalletDescriptors
}

type OPFBWithAmountState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = OPFBWithRecipientWalletState<S, R> & {
  btcProposedAmount?: BtcPaymentAmount
  usdProposedAmount?: UsdPaymentAmount
} & { inputAmount: bigint }

type OPFBWithConversionState<
  S extends WalletCurrency,
  R extends WalletCurrency,
> = RequireField<OPFBWithAmountState<S, R>, "btcProposedAmount" | "usdProposedAmount"> & {
  createdAt: Date
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
