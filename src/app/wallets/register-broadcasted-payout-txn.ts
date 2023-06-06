import { InvalidLedgerTransactionStateError } from "@domain/errors"
import { LedgerTransactionType } from "@domain/ledger"
import { WalletCurrency, paymentAmountFromNumber } from "@domain/shared"
import { LedgerService } from "@services/ledger"
import { getBankOwnerWalletId } from "@services/ledger/caching"
import { recordReceiveOnChainFeeReconciliation } from "@services/ledger/facade"

export const registerBroadcastedPayout = async ({
  payoutId,
  proportionalFee,
  txId,
  vout,
}: {
  payoutId: PayoutId
  proportionalFee: BtcPaymentAmount
  txId: OnChainTxHash
  vout?: OnChainTxVout
}): Promise<true | ApplicationError> => {
  const setTxId = await LedgerService().setOnChainTxIdByPayoutId({ payoutId, txId, vout })
  if (setTxId instanceof Error) return setTxId

  const ledgerTxns = await LedgerService().getTransactionsByPayoutId(payoutId)
  if (ledgerTxns instanceof Error) return ledgerTxns

  const bankOwnerWalletId = await getBankOwnerWalletId()
  const bankOwnerTxns = ledgerTxns.filter((txn) => txn.walletId === bankOwnerWalletId)
  if (bankOwnerTxns.length !== 1) {
    return new InvalidLedgerTransactionStateError(`payoutId: ${payoutId}`)
  }
  const bankOwnerTxn = bankOwnerTxns[0]
  const bankFee = bankOwnerTxn.credit
  const onChainServiceFee = (bankOwnerTxn.satsFee || 0) - bankFee
  const estimatedFee = paymentAmountFromNumber({
    amount: onChainServiceFee,
    currency: WalletCurrency.Btc,
  })
  if (estimatedFee instanceof Error) return estimatedFee
  if (estimatedFee.amount === proportionalFee.amount) return true

  const recorded = await recordReceiveOnChainFeeReconciliation({
    estimatedFee,
    actualFee: proportionalFee,
    hash: txId,
    metadata: { type: LedgerTransactionType.OnchainPayment },
  })
  if (recorded instanceof Error) return recorded

  return true
}
