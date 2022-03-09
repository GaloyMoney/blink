export * from "./errors"

import { InvalidBtcPaymentAmountError } from "./errors"
import { ValidationError } from "@domain/shared"

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
    currency: "BTC",
  }
}
