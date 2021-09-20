import { toSats } from "@domain/bitcoin"

export const WithdrawalFeeCalculator = (wallet: Wallet): WithdrawalFeeCalculator => {
  const onChainFee = (fee: Satoshis): Satoshis => toSats(fee + wallet.withdrawFee)

  return {
    onChainFee,
    onChainIntraLedgerFee: (): Satoshis => toSats(0),
  }
}
