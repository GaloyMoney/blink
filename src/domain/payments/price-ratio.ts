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
    return {
      amount: (convert.amount * btc.amount) / usd.amount,
      currency: WalletCurrency.Btc,
    }
  }

  const convertFromBtc = (convert: BtcPaymentAmount): UsdPaymentAmount => {
    return {
      amount: (convert.amount * usd.amount) / btc.amount,
      currency: WalletCurrency.Usd,
    }
  }

  return {
    convertFromUsd,
    convertFromBtc,
    usdPerSat: () => (Number(usd.amount) / Number(btc.amount)) as DisplayCurrencyPerSat,
  }
}
