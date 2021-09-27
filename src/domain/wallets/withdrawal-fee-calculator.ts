import { toSats } from "@domain/bitcoin"

export const WithdrawalFeeCalculator = (): WithdrawalFeeCalculator => {
  const onChainWithdrawalFee = ({
    onChainFee,
    walletFee,
  }: OnChainWithdrawalFeeArgs): Satoshis => toSats(onChainFee + walletFee)

  return {
    onChainWithdrawalFee,
    onChainIntraLedgerFee: (): Satoshis => toSats(0),
  }
}
