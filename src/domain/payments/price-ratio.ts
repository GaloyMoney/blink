import { WalletCurrency } from "@domain/shared"

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
      return { amount: 0n, currency: WalletCurrency.Btc }
    }

    const amount = (convert.amount * btc.amount) / usd.amount

    return { amount: amount || 1n, currency: WalletCurrency.Btc }
  }

  const convertFromBtc = (
    convert: BtcPaymentAmount,
  ): UsdPaymentAmount | ValidationError => {
    if (convert.amount === 0n) {
      return { amount: 0n, currency: WalletCurrency.Usd }
    }

    const amount = (convert.amount * usd.amount) / btc.amount

    return { amount: amount || 1n, currency: WalletCurrency.Usd }
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
