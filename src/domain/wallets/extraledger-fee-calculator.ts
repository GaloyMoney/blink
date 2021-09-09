import { toSats } from "@domain/bitcoin"

export const ExtraLedgerFeeCalculator = (amount: Satoshis): ExtraLedgerFeeCalculator => {
  const onChainDepositFee = (ratio: DepositFeeRatio) => {
    return toSats(Math.round(amount * ratio))
  }

  return {
    onChainDepositFee,
    lnDepositFee: () => toSats(0),
    lnWithdrawalFee: () => toSats(0),
  }
}
