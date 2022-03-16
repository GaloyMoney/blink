import { toSats } from "@domain/bitcoin"

export const WithdrawalFeeCalculator = ({
  thresholdImbalance,
  feeRatio,
}: OnchainWithdrawalConfig): WithdrawalFeeCalculator => {
  const onChainWithdrawalFee = ({
    minerFee,
    amount,
    minBankFee,
    imbalance,
  }: {
    minerFee: Satoshis
    amount: Satoshis
    minBankFee: Satoshis
    imbalance: SwapOutImbalance
  }) => {
    const imbalanceMinusThreshold = imbalance - thresholdImbalance
    const aboveThreshold =
      imbalanceMinusThreshold < 0 ? imbalanceMinusThreshold : imbalance
    const baseAmount = Math.max(Math.min(aboveThreshold + amount, amount), 0)
    const bankFee = toSats(Math.max(minBankFee, Math.ceil(baseAmount * feeRatio)))
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
