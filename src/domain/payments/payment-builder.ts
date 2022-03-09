import {
  paymentAmountFromCents,
  paymentAmountFromSats,
  WalletCurrency,
  ZERO_SATS,
} from "@domain/shared"
import { checkedToBtcPaymentAmount, checkedToUsdPaymentAmount } from "@domain/payments"
import { InsufficientBalanceError } from "@domain/errors"

import {
  InvalidBtcPaymentAmountError,
  InvalidUsdPaymentAmountError,
  PaymentBuilderNotCompleteError,
} from "./errors"

export const PaymentBuilder = (builderState: Payment = {} as Payment): PaymentBuilder => {
  const withPaymentRequest = (paymentRequest: EncodedPaymentRequest) => {
    return PaymentBuilder({ ...builderState, paymentRequest })
  }

  const withBtcPaymentAmount = (amount: BtcPaymentAmount) => {
    return PaymentBuilder({ ...builderState, btcPaymentAmount: amount })
  }

  const withAmountFromUnknownCurrencyAmount = (amount: number) => {
    return PaymentBuilder({ ...builderState, unknownCurrencyPaymentAmount: amount })
  }

  const withSenderWallet = (senderWallet: Wallet) => {
    let currencyProps: Partial<Payment> = {}

    if (builderState.unknownCurrencyPaymentAmount) {
      if (senderWallet.currency === WalletCurrency.Btc) {
        const paymentAmount = checkedToBtcPaymentAmount(
          builderState.unknownCurrencyPaymentAmount,
        )
        currencyProps =
          paymentAmount instanceof Error
            ? { hasInvalidBtcPaymentAmount: true }
            : { btcPaymentAmount: paymentAmount }
      } else {
        const paymentAmount = checkedToUsdPaymentAmount(
          builderState.unknownCurrencyPaymentAmount,
        )
        currencyProps =
          paymentAmount instanceof Error
            ? { hasInvalidUsdPaymentAmount: true }
            : { usdPaymentAmount: paymentAmount }
      }
    }

    return PaymentBuilder({
      ...builderState,
      ...currencyProps,
      senderWalletId: senderWallet.id,
      senderWalletCurrency: senderWallet.currency,
    })
  }

  const withCheckedIfLocal = (isLocal: boolean) => {
    const newProps = isLocal
      ? {
          isIntraledger: true,
          feeAmount: ZERO_SATS,
        }
      : {}
    return PaymentBuilder({ ...builderState, ...newProps })
  }

  const withCheckedHasBalance = (balanceAmount: PaymentAmount<WalletCurrency>) => {
    const paymentAmount =
      builderState.senderWalletCurrency === WalletCurrency.Btc
        ? builderState.btcPaymentAmount
        : builderState.usdPaymentAmount
    if (paymentAmount === undefined) return PaymentBuilder(builderState)

    const newProps = {
      balanceAmount,
      hasEnoughBalance: balanceAmount.amount >= paymentAmount.amount,
    }
    return PaymentBuilder({ ...builderState, ...newProps })
  }

  const payment = (): Payment | ApplicationError => {
    if (builderState.hasInvalidBtcPaymentAmount) {
      return new InvalidBtcPaymentAmountError()
    }

    if (builderState.hasInvalidUsdPaymentAmount) {
      return new InvalidUsdPaymentAmountError()
    }

    if (builderState.hasEnoughBalance === false) {
      const paymentAmount =
        builderState.senderWalletCurrency === WalletCurrency.Btc
          ? builderState.btcPaymentAmount
          : builderState.usdPaymentAmount
      return new InsufficientBalanceError(
        `Payment amount '${paymentAmount?.amount}' exceeds balance '${builderState.balanceAmount.amount}'`,
      )
    }

    if (builderState.feeAmount === undefined) {
      return new PaymentBuilderNotCompleteError()
    }

    return builderState
  }

  return {
    withPaymentRequest,
    withBtcPaymentAmount,
    withAmountFromUnknownCurrencyAmount,
    withSenderWallet,
    withCheckedIfLocal,
    withCheckedHasBalance,
    payment,
  }
}
