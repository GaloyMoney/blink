import { toSats } from "@domain/bitcoin"

export const WithdrawalFeeCalculator = ({
  thresholdImbalance,
  feeRatio,
}: OnchainWithdrawalConfig): WithdrawalFeeCalculator => {
  const onChainWithdrawalFee = ({
    minerFee,
    minBankFee,
    imbalance,
  }: {
    minerFee: Satoshis
    minBankFee: Satoshis
    imbalance: SwapOutImbalance
  }) => {
    const aboveThreshold = Math.max(imbalance - thresholdImbalance, 0)
    const bankFee = toSats(Math.max(minBankFee, Math.ceil(aboveThreshold * feeRatio)))
    return {
      totalFee: toSats(bankFee + minerFee),
      bankFee,
    }
  }

  return {
    onChainWithdrawalFee,
    onChainIntraLedgerFee: (): Satoshis => toSats(0),
  }
}
