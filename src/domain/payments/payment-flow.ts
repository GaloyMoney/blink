import { InsufficientBalanceError, InvalidCurrencyForWalletError } from "@domain/errors"
import { AmountCalculator, ErrorLevel, WalletCurrency } from "@domain/shared"
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

  const senderWalletDescriptor = (): WalletDescriptor<S> => ({
    id: state.senderWalletId,
    currency: state.senderWalletCurrency,
  })

  const recipientWalletDescriptor = (): WalletDescriptor<R> | undefined =>
    state.recipientWalletId && state.recipientWalletCurrency
      ? {
          id: state.recipientWalletId,
          currency: state.recipientWalletCurrency,
        }
      : undefined

  const checkBalanceForSend = (
    balanceAmount: PaymentAmount<S>,
  ): true | ValidationError => {
    if (state.senderWalletCurrency !== balanceAmount.currency)
      return new InvalidCurrencyForWalletError()

    const { amount, fee } =
      balanceAmount.currency === WalletCurrency.Btc
        ? { amount: state.btcPaymentAmount, fee: state.btcProtocolFee }
        : { amount: state.usdPaymentAmount, fee: state.usdProtocolFee }
    const totalSendAmount = AmountCalculator().add(amount, fee)

    if (balanceAmount.amount < totalSendAmount.amount) {
      const unitForMsg =
        state.senderWalletCurrency === WalletCurrency.Btc ? "sats" : "cents"
      return new InsufficientBalanceError(
        `Payment amount '${totalSendAmount.amount}' ${unitForMsg} exceeds balance '${balanceAmount.amount}'`,
      )
    }

    return true
  }

  return {
    ...state,
    protocolFeeInSenderWalletCurrency,
    paymentAmounts,
    routeDetails,
    recipientDetails,
    senderWalletDescriptor,
    recipientWalletDescriptor,
    checkBalanceForSend,
  }
}
