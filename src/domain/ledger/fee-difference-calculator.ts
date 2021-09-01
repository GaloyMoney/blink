import { toSats } from "@domain/bitcoin"
import { ValidationError } from "@domain/errors"

export const FeeDifferenceCalculator = (): FeeDifferenceCalculator => {
  const paymentFeeDifference = ({
    maxFee,
    actualFee,
  }: {
    maxFee: Satoshis
    actualFee: Satoshis
  }): Satoshis | null => {
    const feeDifference = toSats(maxFee - actualFee)
    if (feeDifference < 0 || feeDifference > maxFee)
      return null
    return feeDifference
  }

  return {
    paymentFeeDifference,
  }
}
