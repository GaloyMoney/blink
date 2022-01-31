import { toSats } from "@domain/bitcoin"

import { FeeDifferenceError } from "./errors"

export const FeeReimbursement = (prepaidFee: Satoshis): FeeReimbursement => {
  const getReimbursement = (actualFee: Satoshis): Satoshis | FeeDifferenceError => {
    const feeDifference = toSats(prepaidFee - actualFee)
    if (feeDifference < 0) return new FeeDifferenceError()
    return feeDifference
  }

  return {
    getReimbursement,
  }
}
