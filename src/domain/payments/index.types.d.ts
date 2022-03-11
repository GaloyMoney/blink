type PaymentFlowState<S extends WalletCurrency> = {
  senderWalletId: WalletId
  senderWalletCurrency: S
  settlementMethod: SettlementMethod
  paymentInitiationMethod: PaymentInitiationMethod
  paymentRequest: EncodedPaymentRequest

  btcProtocolFee: BtcPaymentAmount
  usdProtocolFee?: UsdPaymentAmount

  outgoingNodePubkey?: Pubkey
  cachedRoute?: RawRoute

  btcPaymentAmount?: BtcPaymentAmount
  usdPaymentAmount?: UsdPaymentAmount

  inputAmount: BigInt
}

type PaymentFlow<S extends WalletCurrency> = PaymentFlowState<S> & {
  protocolFeeInSenderWalletCurrency(): PaymentAmount<S>
}

type LightningPaymentFlowBuilder<S extends WalletCurrency> = {
  withSenderWallet(senderWallet: WalletDescriptor<S>): LightningPaymentFlowBuilder<S>
  withInvoice(invoice: LnInvoice): LightningPaymentFlowBuilder<S>
  withUncheckedAmount(amount: number): LightningPaymentFlowBuilder<S>
  withBtcAmount(amount: BtcPaymentAmount): LightningPaymentFlowBuilder<S>
  withRouteResult(routeResult: {
    pubkey: Pubkey
    rawRoute: RawRoute
  }): LightningPaymentFlowBuilder<S>
  needsProtocolFee(): boolean
  btcPaymentAmount(): BtcPaymentAmount | undefined
  usdPaymentAmount(): UsdPaymentAmount | undefined
  payment(): PaymentFlow<S> | ValidationError
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
    payment: PaymentFlow<S>,
  ): Promise<PaymentFlow<S> | RepositoryError>
}

type AmountConverterConfig = {
  dealerFns: IDealerPriceServiceNew
}
type AmountConverter = {
  addAmountsForFutureBuy<S extends WalletCurrency>(
    builder: LightningPaymentFlowBuilder<S>,
  ): Promise<LightningPaymentFlowBuilder<S> | DealerPriceServiceError>
}
