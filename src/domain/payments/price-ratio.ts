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

  const convertFromUsd = (convert: UsdPaymentAmount): BtcPaymentAmount => {
    const amountAsNumber =
      (Number(convert.amount) * Number(btc.amount)) / Number(usd.amount)
    const amount = BigInt(Math.round(amountAsNumber))
    return {
      amount: convert.amount === 0n ? 0n : amount === 0n ? 1n : amount,
      currency: WalletCurrency.Btc,
    }
  }

  const convertFromBtc = (convert: BtcPaymentAmount): UsdPaymentAmount => {
    const amountAsNumber =
      (Number(convert.amount) * Number(usd.amount)) / Number(btc.amount)
    const amount = BigInt(Math.round(amountAsNumber))
    return {
      amount: convert.amount === 0n ? 0n : amount === 0n ? 1n : amount,
      currency: WalletCurrency.Usd,
    }
  }

  return {
    convertFromUsd,
    convertFromBtc,
    usdPerSat: () => (Number(usd.amount) / Number(btc.amount)) as DisplayCurrencyPerSat,
  }
}
