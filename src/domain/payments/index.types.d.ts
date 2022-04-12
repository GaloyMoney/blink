type PriceRatio = {
  convertFromUsd(convert: UsdPaymentAmount): BtcPaymentAmount
  convertFromBtc(convert: BtcPaymentAmount): UsdPaymentAmount
  usdPerSat(): DisplayCurrencyPerSat
}

type PaymentFlowState<S extends WalletCurrency, R extends WalletCurrency> = {
  senderWalletId: WalletId
  senderWalletCurrency: S
  settlementMethod: SettlementMethod
  paymentInitiationMethod: PaymentInitiationMethod
  paymentHash: PaymentHash
  descriptionFromInvoice: string

  btcPaymentAmount: BtcPaymentAmount
  usdPaymentAmount: UsdPaymentAmount
  inputAmount: BigInt

  btcProtocolFee: BtcPaymentAmount
  usdProtocolFee: UsdPaymentAmount

  recipientWalletId?: WalletId
  recipientWalletCurrency?: R
  recipientPubkey?: Pubkey
  recipientUsername?: Username

  outgoingNodePubkey?: Pubkey
  cachedRoute?: RawRoute
}

type PaymentFlow<S extends WalletCurrency, R extends WalletCurrency> = PaymentFlowState<
  S,
  R
> & {
  protocolFeeInSenderWalletCurrency(): PaymentAmount<S>
  paymentAmountInSenderWalletCurrency(): PaymentAmount<S>
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
  senderWalletDescriptor(): WalletDescriptor<WalletCurrency>
  recipientWalletDescriptor(): WalletDescriptor<WalletCurrency> | undefined
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
