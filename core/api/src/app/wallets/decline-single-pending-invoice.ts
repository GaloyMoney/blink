import {
  ProcessPendingInvoiceResult,
  ProcessedReason,
} from "./process-pending-invoice-result"

import { InvoiceNotFoundError } from "@/domain/bitcoin/lightning"

import { InvalidNonHodlInvoiceError } from "@/domain/errors"

import { addAttributesToCurrentSpan, wrapAsyncToRunInSpan } from "@/services/tracing"
import { WalletInvoicesRepository } from "@/services/mongoose"
import { LndService } from "@/services/lnd"

import { elapsedSinceTimestamp } from "@/utils"

export const declineHeldInvoice = wrapAsyncToRunInSpan({
  namespace: "app.invoices",
  fnName: "declineHeldInvoice",
  fn: async ({
    walletInvoice,
    logger,
  }: {
    walletInvoice: WalletInvoiceWithOptionalLnInvoice
    logger: Logger
  }): Promise<boolean | ApplicationError> => {
    const { paymentHash, pubkey } = walletInvoice
    const pendingInvoiceLogger = logger.child({
      hash: paymentHash,
      pubkey,
      topic: "payment",
      protocol: "lightning",
      transactionType: "receipt",
      onUs: false,
    })

    const result = await processPendingInvoiceForDecline({
      walletInvoice,
      logger: pendingInvoiceLogger,
    })

    if (result.markProcessedAsCanceledOrExpired()) {
      const processingCompletedInvoice =
        await WalletInvoicesRepository().markAsProcessingCompleted(paymentHash)
      if (processingCompletedInvoice instanceof Error) {
        pendingInvoiceLogger.error("Unable to mark invoice as processingCompleted")
        return processingCompletedInvoice
      }
    }

    return !(result.markProcessedAsPaid() || result.markProcessedAsCanceledOrExpired())
      ? false
      : result.markProcessedAsCanceledOrExpired()
        ? false
        : result.error()
          ? result.error()
          : result.markProcessedAsPaid()
  },
})

export const processPendingInvoiceForDecline = async ({
  walletInvoice,
  logger: pendingInvoiceLogger,
}: {
  walletInvoice: WalletInvoiceWithOptionalLnInvoice
  logger: Logger
}): Promise<ProcessPendingInvoiceResult> => {
  const { pubkey, paymentHash } = walletInvoice
  addAttributesToCurrentSpan({ paymentHash, pubkey })

  // Fetch invoice from lnd service
  const lndService = LndService()
  if (lndService instanceof Error) {
    return ProcessPendingInvoiceResult.processAsPaidWithError(lndService)
  }

  const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })
  if (lnInvoiceLookup instanceof InvoiceNotFoundError) {
    return ProcessPendingInvoiceResult.processAsCanceledOrExpired(
      ProcessedReason.InvoiceNotFound,
    )
  }
  if (lnInvoiceLookup instanceof Error) {
    return ProcessPendingInvoiceResult.processAsPaidWithError(lnInvoiceLookup)
  }

  // Check status on invoice fetched from lnd
  const { isSettled, isHeld } = lnInvoiceLookup
  if (isSettled) {
    return ProcessPendingInvoiceResult.processAsPaidWithError(
      new InvalidNonHodlInvoiceError(JSON.stringify({ paymentHash })),
    )
  }
  if (!isHeld) {
    pendingInvoiceLogger.info({ lnInvoiceLookup }, "invoice has not been paid yet")
    ProcessPendingInvoiceResult.notPaid()
  }

  // Cancel held invoice
  const { heldAt } = lnInvoiceLookup
  const heldForMsg = heldAt ? `for ${elapsedSinceTimestamp(heldAt)}s ` : ""
  pendingInvoiceLogger.error(
    { lnInvoiceLookup },
    `invoice has been held ${heldForMsg}and is now been cancelled`,
  )
  const invoiceSettled = await lndService.cancelInvoice({ pubkey, paymentHash })
  if (invoiceSettled instanceof Error) {
    return ProcessPendingInvoiceResult.processAsPaidWithError(invoiceSettled)
  }

  return ProcessPendingInvoiceResult.processAsPaid()
}
