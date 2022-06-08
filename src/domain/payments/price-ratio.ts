import { RATIO_PRECISION } from "@config"
import { AmountCalculator, WalletCurrency } from "@domain/shared"

import { InvalidZeroAmountPriceRatioInputError } from "./errors"

const calc = AmountCalculator()

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

  const convertFromUsd = (convert: UsdPaymentAmount): BtcPaymentAmount => {
    const currency = WalletCurrency.Btc

    if (convert.amount === 0n) {
      return { amount: 0n, currency }
    }

    const amount = calc.divRound(
      { amount: convert.amount * btc.amount, currency },
      usd.amount,
    )

    return { amount: amount.amount || 1n, currency }
  }

  const convertFromBtc = (convert: BtcPaymentAmount): UsdPaymentAmount => {
    const currency = WalletCurrency.Usd

    if (convert.amount === 0n) {
      return { amount: 0n, currency }
    }

    const amount = calc.divRound(
      { amount: convert.amount * usd.amount, currency },
      btc.amount,
    )

    return { amount: amount.amount || 1n, currency }
  }

  const convertFromBtcToFloor = (convert: BtcPaymentAmount): UsdPaymentAmount =>
    calc.divFloor(
      { amount: convert.amount * usd.amount, currency: WalletCurrency.Usd },
      btc.amount,
    )

  const convertFromBtcToCeil = (convert: BtcPaymentAmount): UsdPaymentAmount =>
    calc.divCeil(
      { amount: convert.amount * usd.amount, currency: WalletCurrency.Usd },
      btc.amount,
    )

  return {
    convertFromUsd,
    convertFromBtc,
    convertFromBtcToFloor,
    convertFromBtcToCeil,
    usdPerSat: () =>
      (Number(usd.amount) / Number(btc.amount)) as DisplayCurrencyBasePerSat,
  }
}

export const toPriceRatio = (ratio: number): PriceRatio | ValidationError => {
  const precision = RATIO_PRECISION

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
