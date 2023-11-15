import * as LedgerFacade from "@/services/ledger/facade"

export const registerBroadcastedPayout = async ({
  payoutId,
  proportionalFee,
  txId,
  vout,
}: {
  payoutId: PayoutId
  proportionalFee: BtcPaymentAmount
  txId: OnChainTxHash
  vout: OnChainTxVout
}): Promise<true | ApplicationError> => {
  const setTxIdResult = await LedgerFacade.setOnChainTxIdByPayoutId({
    payoutId,
    txId,
    vout,
  })
  if (setTxIdResult instanceof Error) return setTxIdResult

  const { estimatedProtocolFee } = setTxIdResult
  if (estimatedProtocolFee.amount === proportionalFee.amount) return true

  const isRecorded = await LedgerFacade.isOnChainFeeReconciliationRecorded(payoutId)
  if (isRecorded !== false) return isRecorded

  const { metadata } = LedgerFacade.OnChainFeeReconciliationLedgerMetadata({
    payoutId,
    txHash: txId,
    pending: true,
  })
  const recorded = await LedgerFacade.recordReceiveOnChainFeeReconciliation({
    estimatedFee: estimatedProtocolFee,
    actualFee: proportionalFee,
    metadata,
  })
  if (recorded instanceof Error) return recorded

  return true
}
