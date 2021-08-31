import { toSats } from "@domain/bitcoin"
import { ValidationError } from "@domain/errors"

export const FeeDifferenceCalculator = (): FeeDifferenceCalculator => {
  const paymentFeeDifference = ({
    maxFee,
    actualFee,
  }: {
    maxFee: Satoshis
    actualFee: Satoshis
  }): Satoshis | ValidationError => {
    const feeDifference = toSats(maxFee - actualFee)
    if (feeDifference < 0 || feeDifference > maxFee)
      return new ValidationError(`Invalid fee difference '${feeDifference}'`)
    return feeDifference
  }

  return {
    paymentFeeDifference,
  }
}
