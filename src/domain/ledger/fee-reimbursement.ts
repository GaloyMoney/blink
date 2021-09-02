import { toSats } from "@domain/bitcoin"

export const FeeReimbursement = (prepaidFee: Satoshis): FeeReimbursement => {
  const getReimbursement = ({ actualFee }: { actualFee: Satoshis }): Satoshis | null => {
    const feeDifference = toSats(prepaidFee - actualFee)
    if (feeDifference < 0 || feeDifference > prepaidFee) return null
    return feeDifference
  }

  return {
    getReimbursement,
  }
}
