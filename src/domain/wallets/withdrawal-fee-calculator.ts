import { toSats } from "@domain/bitcoin"

import { WithdrawalFeePriceMethod } from "."

export const WithdrawalFeeCalculator = ({
  thresholdImbalance,
  feeRatio,
}: OnchainWithdrawalConfig): WithdrawalFeeCalculator => {
  const onChainWithdrawalFlatFee = async ({
    minBankFee,
    minerFee,
  }: OnChainWithdrawalFlatFeeArgs): Promise<WithdrawalFeeCalculatorRes> => ({
    totalFee: toSats(minerFee + minBankFee),
    bankFee: minBankFee,
  })

  const onChainWithdrawalProportionalOnImbalanceFee = async ({
    minerFee,
    minBankFee,
    imbalanceCalculatorFn,
  }: OnChainWithdrawalProportionalOnImbalanceFeeArgs): Promise<
    WithdrawalFeeCalculatorRes | LedgerServiceError
  > => {
    const imbalance = await imbalanceCalculatorFn()
    if (imbalance instanceof Error) return imbalance

    const aboveThreshold = Math.max(imbalance - thresholdImbalance, 0)
    const bankFee = toSats(Math.max(minBankFee, Math.ceil(aboveThreshold * feeRatio)))
    return {
      totalFee: toSats(bankFee + minerFee),
      bankFee,
    }
  }

  const onChainWithdrawalFee = async ({
    method,
    minerFee,
    minBankFee,
    imbalanceCalculatorFn,
  }: {
    method: WithdrawalFeePriceMethod
    minerFee: Satoshis
    minBankFee: Satoshis
    imbalanceCalculatorFn: () => Promise<SwapOutImbalance | LedgerServiceError>
  }) => {
    if (method === WithdrawalFeePriceMethod.flat) {
      return onChainWithdrawalFlatFee({ minerFee, minBankFee })
    } else {
      return onChainWithdrawalProportionalOnImbalanceFee({
        minerFee,
        minBankFee,
        imbalanceCalculatorFn,
      })
    }
  }

  return {
    onChainWithdrawalFee,
    onChainIntraLedgerFee: async (): Promise<Satoshis> => toSats(0),
  }
}
