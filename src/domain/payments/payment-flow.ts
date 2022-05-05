import { ErrorLevel, WalletCurrency } from "@domain/shared"
import { recordExceptionInCurrentSpan } from "@services/tracing"

import { RouteValidator } from "./route-validator"

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

  const paymentAmounts = (): { btc: BtcPaymentAmount; usd: UsdPaymentAmount } => ({
    btc: state.btcPaymentAmount,
    usd: state.usdPaymentAmount,
  })

  const routeDetails = (): {
    rawRoute: RawRoute | undefined
    outgoingNodePubkey: Pubkey | undefined
  } => {
    const uncheckedRawRoute = state.cachedRoute

    let rawRoute: RawRoute | undefined = uncheckedRawRoute
    if (uncheckedRawRoute) {
      const validateRoute = RouteValidator(uncheckedRawRoute).validate(
        state.btcPaymentAmount,
      )
      if (validateRoute instanceof Error) {
        rawRoute = undefined
        recordExceptionInCurrentSpan({ error: validateRoute, level: ErrorLevel.Warn })
      }
    }

    return {
      rawRoute,
      outgoingNodePubkey: rawRoute ? state.outgoingNodePubkey : undefined,
    }
  }

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
    paymentAmounts,
    routeDetails,
    recipientDetails,
    senderWalletDescriptor,
    recipientWalletDescriptor,
  }
}
