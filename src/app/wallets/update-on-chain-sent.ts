import { ONCHAIN_SCAN_DEPTH, BTC_NETWORK } from "@config"

import { ErrorLevel } from "@domain/shared"
import { OnChainError, TxDecoder } from "@domain/bitcoin/onchain"

import { baseLogger } from "@services/logger"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/lnd/onchain-service"
import { recordExceptionInCurrentSpan } from "@services/tracing"

export const updateOnChainSent = async ({
  scanDepth = ONCHAIN_SCAN_DEPTH,
}: {
  scanDepth?: ScanDepth
}): Promise<number | ApplicationError> => {
  const ledgerService = LedgerService()
  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof OnChainError) return onChainService

  const onChainTxs = await onChainService.listOutgoingTransactions(scanDepth)
  if (onChainTxs instanceof Error) return onChainTxs

  for (const tx of onChainTxs) {
    if (tx.confirmations <= 0) continue

    const txHash = tx.rawTx.txHash
    baseLogger.trace({ txHash }, "updating onchain sent")

    const settled = await ledgerService.settlePendingOnChainPayment(txHash)

    if (settled instanceof Error) {
      baseLogger.error({ success: false, txHash, settled }, "payment settle fail")
      recordExceptionInCurrentSpan({ error: settled, level: ErrorLevel.Warn })
      continue
    }
  }

  baseLogger.info(`finish updating onchain sent with ${onChainTxs.length} transactions`)

  return onChainTxs.length
}
