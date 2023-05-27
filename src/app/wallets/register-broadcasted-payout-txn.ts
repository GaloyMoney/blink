import { LedgerService } from "@services/ledger"

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
}) => {
  // TODO: What do we want to do with the actual fee?
  // - reimburse if over than estimated/recorded?
  // - ignore?
  proportionalFee

  return LedgerService().setOnChainTxIdBySendHash({ payoutId, txId, vout })
}
