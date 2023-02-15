import { RATIO_PRECISION } from "@config"
import { AmountCalculator, WalletCurrency } from "@domain/shared"

import { InvalidZeroAmountPriceRatioInputError } from "./errors"

const calc = AmountCalculator()

export const PriceRatio = ({
  other,
  btc,
}: {
  other: bigint
  btc: BtcPaymentAmount
}): PriceRatio | ValidationError => {
  if (other === 0n || btc.amount === 0n) {
    return new InvalidZeroAmountPriceRatioInputError()
  }

  const currency = WalletCurrency.Btc

  const convertFromOther = (otherToConvert: bigint): BtcPaymentAmount => {
    if (otherToConvert === 0n) {
      return { amount: 0n, currency }
    }

    const { amount } = calc.divRound(
      { amount: otherToConvert * btc.amount, currency },
      other,
    )

    return { amount: amount || 1n, currency }
  }

  const convertFromBtc = (btcWalletAmount: BtcPaymentAmount): bigint => {
    if (btcWalletAmount.amount === 0n) return 0n

    const { amount } = calc.divRound(
      { amount: btcWalletAmount.amount * other, currency },
      btc.amount,
    )

    return amount || 1n
  }

  const convertFromBtcToFloor = (btcWalletAmount: BtcPaymentAmount): bigint =>
    calc.divFloor({ amount: btcWalletAmount.amount * other, currency }, btc.amount).amount

  const convertFromBtcToCeil = (btcWalletAmount: BtcPaymentAmount): bigint =>
    calc.divCeil({ amount: btcWalletAmount.amount * other, currency }, btc.amount).amount

  return {
    convertFromOther,
    convertFromBtc,
    convertFromBtcToFloor,
    convertFromBtcToCeil,
    usdPerSat: () => (Number(other) / Number(btc.amount)) as DisplayCurrencyBasePerSat,
  }
}

export const WalletPriceRatio = ({
  usd,
  btc,
}: {
  usd: UsdPaymentAmount
  btc: BtcPaymentAmount
}): WalletPriceRatio | ValidationError => {
  const otherCurrency = WalletCurrency.Usd

  const priceRatio = PriceRatio({ other: usd.amount, btc })
  if (priceRatio instanceof Error) return priceRatio

  return {
    convertFromUsd: (usdWalletAmount: UsdPaymentAmount): BtcPaymentAmount =>
      priceRatio.convertFromOther(usdWalletAmount.amount),

    convertFromBtc: (btcWalletAmount: BtcPaymentAmount): UsdPaymentAmount => ({
      amount: priceRatio.convertFromBtc(btcWalletAmount),
      currency: otherCurrency,
    }),

    convertFromBtcToFloor: (btcWalletAmount: BtcPaymentAmount): UsdPaymentAmount => ({
      amount: priceRatio.convertFromBtcToFloor(btcWalletAmount),
      currency: otherCurrency,
    }),

    convertFromBtcToCeil: (btcWalletAmount: BtcPaymentAmount): UsdPaymentAmount => ({
      amount: priceRatio.convertFromBtcToCeil(btcWalletAmount),
      currency: otherCurrency,
    }),

    usdPerSat: () =>
      (Number(usd.amount) / Number(btc.amount)) as DisplayCurrencyBasePerSat,
  }
}

export const toWalletPriceRatio = (ratio: number): WalletPriceRatio | ValidationError => {
  const precision = RATIO_PRECISION

  const usd: UsdPaymentAmount = {
    amount: BigInt(Math.floor(ratio * precision)),
    currency: WalletCurrency.Usd,
  }

  const btc: BtcPaymentAmount = {
    amount: BigInt(precision),
    currency: WalletCurrency.Btc,
  }

  return WalletPriceRatio({ usd, btc })
}
