import { WalletCurrency } from "@domain/shared"

export const PaymentFlow = <S extends WalletCurrency, R extends WalletCurrency>(
  state: PaymentFlowState<S, R>,
): PaymentFlow<S, R> => {
  const protocolFeeInSenderWalletCurrency = (): PaymentAmount<S> => {
    return state.senderWalletCurrency === WalletCurrency.Btc
      ? (state.btcProtocolFee as PaymentAmount<S>)
      : (state.usdProtocolFee as PaymentAmount<S>)
  }

  const protocolFeeInBtc = (): BtcPaymentAmount => state.btcProtocolFee

  const paymentAmountInSenderWalletCurrency = (): PaymentAmount<S> => {
    return state.senderWalletCurrency === WalletCurrency.Btc
      ? (state.btcPaymentAmount as PaymentAmount<S>)
      : (state.usdPaymentAmount as PaymentAmount<S>)
  }

  const paymentAmountInBtc = (): BtcPaymentAmount => state.btcPaymentAmount

  const paymentAmountInUsd = (): UsdPaymentAmount => state.usdPaymentAmount

  const routeFromCachedRoute = (): {
    rawRoute?: RawRoute
    outgoingNodePubkey?: Pubkey
  } => ({
    rawRoute: state.cachedRoute,
    outgoingNodePubkey: state.outgoingNodePubkey,
  })

  const recipientDetails = (): {
    recipientWalletId: WalletId | undefined
    recipientWalletCurrency: WalletCurrency | undefined
    recipientPubkey: Pubkey | undefined
  } => ({
    recipientWalletId: state.recipientWalletId,
    recipientWalletCurrency: state.recipientWalletCurrency,
    recipientPubkey: state.recipientPubkey,
  })

  return {
    ...state,
    protocolFeeInSenderWalletCurrency,
    protocolFeeInBtc,
    paymentAmountInSenderWalletCurrency,
    paymentAmountInBtc,
    paymentAmountInUsd,
    routeFromCachedRoute,
    recipientDetails,
  }
}
