export * from "./errors"
export * from "./payment-builder"

import { ValidationError, WalletCurrency } from "@domain/shared"

import { InvalidBtcPaymentAmountError, InvalidUsdPaymentAmountError } from "./errors"

export const checkedToBtcPaymentAmount = (
  amount: number | null,
): BtcPaymentAmount | ValidationError => {
  if (amount === null) {
    return new InvalidBtcPaymentAmountError()
  }
  if (Math.floor(amount) != amount) {
    return new InvalidBtcPaymentAmountError()
  }
  if (!(amount && amount > 0)) return new InvalidBtcPaymentAmountError()
  return {
    amount: BigInt(amount),
    currency: WalletCurrency.Btc,
  }
}

export const checkedToUsdPaymentAmount = (
  amount: number | null,
): UsdPaymentAmount | ValidationError => {
  if (amount === null) {
    return new InvalidUsdPaymentAmountError()
  }
  if (Math.floor(amount) != amount) {
    return new InvalidUsdPaymentAmountError()
  }
  if (!(amount && amount > 0)) return new InvalidUsdPaymentAmountError()
  return {
    amount: BigInt(amount),
    currency: WalletCurrency.Usd,
  }
}
