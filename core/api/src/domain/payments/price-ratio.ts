import { InvalidZeroAmountPriceRatioInputError } from "./errors"

import { RATIO_PRECISION } from "@/config"

import { getCurrencyMajorExponent } from "@/domain/fiat"
import { AmountCalculator, safeBigInt, WalletCurrency } from "@/domain/shared"

const calc = AmountCalculator()

export const PriceRatio = <S extends WalletCurrency>({
  other,
  walletAmount,
}: {
  other: bigint
  walletAmount: PaymentAmount<S>
}): PriceRatio<S> | ValidationError => {
  if (other === 0n || walletAmount.amount === 0n) {
    return new InvalidZeroAmountPriceRatioInputError()
  }

  const { currency } = walletAmount

  const convertFromOther = (otherToConvert: bigint): PaymentAmount<S> => {
    if (otherToConvert === 0n) {
      return { amount: 0n, currency }
    }

    const { amount } = calc.divRound(
      { amount: otherToConvert * walletAmount.amount, currency },
      other,
    )

    return { amount: amount || 1n, currency }
  }

  const convertFromWallet = (walletAmountToConvert: PaymentAmount<S>): bigint => {
    if (walletAmountToConvert.amount === 0n) return 0n

    const { amount } = calc.divRound(
      { amount: walletAmountToConvert.amount * other, currency },
      walletAmount.amount,
    )

    return amount || 1n
  }

  const convertFromWalletToFloor = (walletAmountToConvert: PaymentAmount<S>): bigint =>
    calc.divFloor(
      { amount: walletAmountToConvert.amount * other, currency },
      walletAmount.amount,
    ).amount

  const convertFromWalletToCeil = (walletAmountToConvert: PaymentAmount<S>): bigint =>
    calc.divCeil(
      { amount: walletAmountToConvert.amount * other, currency },
      walletAmount.amount,
    ).amount

  return {
    convertFromOther,
    convertFromWallet,
    convertFromWalletToFloor,
    convertFromWalletToCeil,
    otherUnitPerWalletUnit: () =>
      (Number(other) / Number(walletAmount.amount)) as DisplayCurrencyBasePerSat,
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

  const priceRatio = PriceRatio({ other: usd.amount, walletAmount: btc })
  if (priceRatio instanceof Error) return priceRatio

  return {
    convertFromUsd: (usdWalletAmount: UsdPaymentAmount): BtcPaymentAmount =>
      priceRatio.convertFromOther(usdWalletAmount.amount),

    convertFromBtc: (btcWalletAmount: BtcPaymentAmount): UsdPaymentAmount => ({
      amount: priceRatio.convertFromWallet(btcWalletAmount),
      currency: otherCurrency,
    }),

    convertFromBtcToFloor: (btcWalletAmount: BtcPaymentAmount): UsdPaymentAmount => ({
      amount: priceRatio.convertFromWalletToFloor(btcWalletAmount),
      currency: otherCurrency,
    }),

    convertFromBtcToCeil: (btcWalletAmount: BtcPaymentAmount): UsdPaymentAmount => ({
      amount: priceRatio.convertFromWalletToCeil(btcWalletAmount),
      currency: otherCurrency,
    }),

    usdPerSat: priceRatio.otherUnitPerWalletUnit,
  }
}

const toDisplayAmount = <T extends DisplayCurrency>({
  amountInMinor,
  currency,
}: {
  amountInMinor: bigint
  currency: T
}): DisplayAmount<T> => {
  const displayMajorExponent = getCurrencyMajorExponent(currency)

  const displayInMajor = (Number(amountInMinor) / 10 ** displayMajorExponent).toFixed(
    displayMajorExponent,
  )

  return {
    amountInMinor,
    currency,
    displayInMajor,
  }
}

export const toDisplayBaseAmount = (
  displayAmount: DisplayAmount<DisplayCurrency>,
): DisplayCurrencyBaseAmount =>
  Number(displayAmount.amountInMinor) as DisplayCurrencyBaseAmount

export const DisplayPriceRatio = <S extends WalletCurrency, T extends DisplayCurrency>({
  displayAmount,
  walletAmount,
}: {
  displayAmount: DisplayAmount<T>
  walletAmount: PaymentAmount<S>
}): DisplayPriceRatio<S, T> | ValidationError => {
  const { currency: displayCurrency } = displayAmount
  const { currency: walletCurrency } = walletAmount

  const { amountInMinor: displayAmountValue } = displayAmount
  const priceRatio = PriceRatio({
    other: displayAmountValue,
    walletAmount,
  })
  if (priceRatio instanceof Error) return priceRatio

  return {
    convertFromDisplayMinorUnit: (displayAmount: DisplayAmount<T>): PaymentAmount<S> =>
      priceRatio.convertFromOther(displayAmount.amountInMinor),

    convertFromWallet: (walletAmountToConvert: PaymentAmount<S>): DisplayAmount<T> =>
      toDisplayAmount({
        amountInMinor: priceRatio.convertFromWallet(walletAmountToConvert),
        currency: displayCurrency,
      }),

    convertFromWalletToFloor: (
      walletAmountToConvert: PaymentAmount<S>,
    ): DisplayAmount<T> =>
      toDisplayAmount({
        amountInMinor: priceRatio.convertFromWalletToFloor(walletAmountToConvert),
        currency: displayCurrency,
      }),

    convertFromWalletToCeil: (
      walletAmountToConvert: PaymentAmount<S>,
    ): DisplayAmount<T> =>
      toDisplayAmount({
        amountInMinor: priceRatio.convertFromWalletToCeil(walletAmountToConvert),
        currency: displayCurrency,
      }),

    displayMinorUnitPerWalletUnit: priceRatio.otherUnitPerWalletUnit,
    displayCurrency,
    walletCurrency,
  }
}

export const toWalletPriceRatio = (ratio: number): WalletPriceRatio | ValidationError => {
  const precision = RATIO_PRECISION

  const amount = safeBigInt(Math.floor(ratio * precision))
  if (amount instanceof Error) return amount

  const usd: UsdPaymentAmount = {
    amount,
    currency: WalletCurrency.Usd,
  }

  const btc: BtcPaymentAmount = {
    amount: BigInt(precision),
    currency: WalletCurrency.Btc,
  }

  return WalletPriceRatio({ usd, btc })
}

export const toDisplayPriceRatio = <S extends WalletCurrency, T extends DisplayCurrency>({
  ratio,
  displayCurrency,
  walletCurrency = WalletCurrency.Btc as S,
}: {
  ratio: number
  displayCurrency: T
  walletCurrency?: S
}): DisplayPriceRatio<S, T> | ValidationError => {
  const precision = RATIO_PRECISION

  const amountInMinor = safeBigInt(Math.floor(ratio * precision))
  if (amountInMinor instanceof Error) return amountInMinor

  const displayAmount: DisplayAmount<T> = toDisplayAmount({
    amountInMinor,
    currency: displayCurrency,
  })

  const walletAmount: PaymentAmount<S> = {
    amount: BigInt(precision),
    currency: walletCurrency,
  }

  return DisplayPriceRatio({ displayAmount, walletAmount })
}
