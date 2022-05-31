import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"

import { InvalidZeroAmountPriceRatioInputError } from "./errors"

export const PriceRatio = ({
  usd,
  btc,
}: {
  usd: UsdPaymentAmount
  btc: BtcPaymentAmount
}): PriceRatio | ValidationError => {
  if (usd.amount === 0n || btc.amount === 0n) {
    return new InvalidZeroAmountPriceRatioInputError()
  }

  const convertFromUsd = (
    convert: UsdPaymentAmount,
  ): BtcPaymentAmount | ValidationError => {
    if (convert.amount === 0n) {
      return paymentAmountFromNumber({ amount: 0, currency: WalletCurrency.Btc })
    }

    const amount = Math.round(
      (Number(convert.amount) * Number(btc.amount)) / Number(usd.amount),
    )
    return paymentAmountFromNumber({ amount: amount || 1, currency: WalletCurrency.Btc })
  }

  const convertFromBtc = (
    convert: BtcPaymentAmount,
  ): UsdPaymentAmount | ValidationError => {
    if (convert.amount === 0n) {
      return paymentAmountFromNumber({ amount: 0, currency: WalletCurrency.Usd })
    }

    const amount = Math.round(
      (Number(convert.amount) * Number(usd.amount)) / Number(btc.amount),
    )
    return paymentAmountFromNumber({ amount: amount || 1, currency: WalletCurrency.Usd })
  }

  return {
    convertFromUsd,
    convertFromBtc,
    usdPerSat: () =>
      (Number(usd.amount) / Number(btc.amount)) as DisplayCurrencyBasePerSat,
  }
}

export const toPriceRatio = (ratio: number): PriceRatio | ValidationError => {
  const precision = 1_000_000

  const usd: UsdPaymentAmount = {
    amount: BigInt(Math.floor(ratio * precision)),
    currency: WalletCurrency.Usd,
  }

  const btc: BtcPaymentAmount = {
    amount: BigInt(precision),
    currency: WalletCurrency.Btc,
  }

  return PriceRatio({ usd, btc })
}
