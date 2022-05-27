import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { paymentAmountFromCents, paymentAmountFromSats } from "@domain/shared"

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
    const amount = Math.round(amountAsNumber)
    const btcAmount = convert.amount === 0n ? 0n : amount === 0 ? 1n : amount
    return paymentAmountFromSats(toSats(btcAmount))
  }

  const convertFromBtc = (convert: BtcPaymentAmount): UsdPaymentAmount => {
    const amountAsNumber =
      (Number(convert.amount) * Number(usd.amount)) / Number(btc.amount)
    const amount = Math.round(amountAsNumber)
    const usdAmount = convert.amount === 0n ? 0 : amount === 0 ? 1 : amount
    return paymentAmountFromCents(toCents(usdAmount))
  }

  return {
    convertFromUsd,
    convertFromBtc,
    usdPerSat: () =>
      (Number(usd.amount) / Number(btc.amount)) as DisplayCurrencyBasePerSat,
  }
}
