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
    const amount = (convert.amount * btc.amount) / usd.amount
    return {
      amount: amount === 0n ? 1n : amount,
      currency: WalletCurrency.Btc,
    }
  }

  const convertFromBtc = (convert: BtcPaymentAmount): UsdPaymentAmount => {
    const amount = (convert.amount * usd.amount) / btc.amount
    return {
      amount: amount === 0n ? 1n : amount,
      currency: WalletCurrency.Usd,
    }
  }

  return {
    convertFromUsd,
    convertFromBtc,
    usdPerSat: () => (Number(usd.amount) / Number(btc.amount)) as DisplayCurrencyPerSat,
  }
}
