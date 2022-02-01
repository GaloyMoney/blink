import { toSats } from "@domain/bitcoin"

export const WithdrawalFeeCalculator = (): WithdrawalFeeCalculator => {
  const onChainWithdrawalFee = ({
    minerFee,
    bankFee,
  }: OnChainWithdrawalFeeArgs): Satoshis => toSats(minerFee + bankFee)

  return {
    onChainWithdrawalFee,
    onChainIntraLedgerFee: (): Satoshis => toSats(0),
  }
}
