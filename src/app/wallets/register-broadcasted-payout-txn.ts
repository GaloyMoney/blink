import {
  InvalidLedgerTransactionStateError,
  NoTransactionToUpdateError,
} from "@domain/errors"
import { WalletCurrency, paymentAmountFromNumber } from "@domain/shared"
import { LedgerService } from "@services/ledger"
import { getBankOwnerWalletId } from "@services/ledger/caching"
import {
  OnChainFeeReconciliationLedgerMetadata,
  recordReceiveOnChainFeeReconciliation,
} from "@services/ledger/facade"

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
  const ledger = LedgerService()

  const setTxId = await ledger.setOnChainTxIdByPayoutId({ payoutId, txId, vout })
  if (setTxId instanceof NoTransactionToUpdateError) {
    const txns = await ledger.getTransactionsByPayoutId(payoutId)
    if (txns instanceof Error) return txns
    if (txns === undefined) return new InvalidLedgerTransactionStateError(payoutId)

    const txHashes = txns.map((txn) => txn.txHash)
    if (new Set(txHashes).size !== 1) {
      return new InvalidLedgerTransactionStateError(`${txHashes}`)
    }

    if (txHashes[0] !== txId)
      return new InvalidLedgerTransactionStateError(
        `${{ persistedTxHash: txHashes[0], incomingTxId: txId }}`,
      )
  }
  if (setTxId instanceof Error && !(setTxId instanceof NoTransactionToUpdateError)) {
    return setTxId
  }

  const ledgerTxns = await ledger.getTransactionsByPayoutId(payoutId)
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

  const { metadata } = OnChainFeeReconciliationLedgerMetadata({
    payoutId,
    txHash: txId,
    pending: true,
  })
  const recorded = await recordReceiveOnChainFeeReconciliation({
    estimatedFee,
    actualFee: proportionalFee,
    metadata,
  })
  if (recorded instanceof Error) return recorded

  return true
}
