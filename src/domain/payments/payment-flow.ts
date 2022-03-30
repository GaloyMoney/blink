import { WalletCurrency } from "@domain/shared"

export const PaymentFlow = <S extends WalletCurrency, R extends WalletCurrency>(
  state: PaymentFlowState<S, R>,
): PaymentFlow<S, R> => {
  const protocolFeeInSenderWalletCurrency = (): PaymentAmount<S> => {
    return state.senderWalletCurrency === WalletCurrency.Btc
      ? (state.btcProtocolFee as PaymentAmount<S>)
      : (state.usdProtocolFee as PaymentAmount<S>)
  }

  const paymentAmountInSenderWalletCurrency = (): PaymentAmount<S> => {
    return state.senderWalletCurrency === WalletCurrency.Btc
      ? (state.btcPaymentAmount as PaymentAmount<S>)
      : (state.usdPaymentAmount as PaymentAmount<S>)
  }

  const routeDetails = (): {
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
    recipientUsername: Username | undefined
  } => ({
    recipientWalletId: state.recipientWalletId,
    recipientWalletCurrency: state.recipientWalletCurrency,
    recipientPubkey: state.recipientPubkey,
    recipientUsername: state.recipientUsername,
  })

  const senderWalletDescriptor = (): WalletDescriptor<WalletCurrency> => ({
    id: state.senderWalletId,
    currency: state.senderWalletCurrency,
  })

  const recipientWalletDescriptor = (): WalletDescriptor<WalletCurrency> | undefined =>
    state.recipientWalletId && state.recipientWalletCurrency
      ? {
          id: state.recipientWalletId,
          currency: state.recipientWalletCurrency,
        }
      : undefined

  return {
    ...state,
    protocolFeeInSenderWalletCurrency,
    paymentAmountInSenderWalletCurrency,
    routeDetails,
    recipientDetails,
    senderWalletDescriptor,
    recipientWalletDescriptor,
  }
}
