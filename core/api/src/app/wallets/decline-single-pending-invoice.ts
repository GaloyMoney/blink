import {
  ProcessPendingInvoiceResult,
  ProcessPendingInvoiceResultType,
  ProcessedReason,
} from "./process-pending-invoice-result"

import { InvoiceNotFoundError } from "@/domain/bitcoin/lightning"

import { InvalidNonHodlInvoiceError } from "@/domain/errors"

import { addAttributesToCurrentSpan, wrapAsyncToRunInSpan } from "@/services/tracing"
import { WalletInvoicesRepository } from "@/services/mongoose"
import { LndService } from "@/services/lnd"

import { elapsedSinceTimestamp } from "@/utils"

const assertUnreachable = (x: never): never => {
  throw new Error(`This should never compile with ${x}`)
}

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

    const walletInvoices = WalletInvoicesRepository()
    let marked: WalletInvoiceWithOptionalLnInvoice | RepositoryError
    switch (result.type) {
      case ProcessPendingInvoiceResultType.MarkProcessedAsCanceledOrExpired:
        marked = await walletInvoices.markAsProcessingCompleted(paymentHash)
        if (marked instanceof Error) {
          pendingInvoiceLogger.error("Unable to mark invoice as processingCompleted")
          return marked
        }
        return true

      case ProcessPendingInvoiceResultType.Error:
        return result.error

      case ProcessPendingInvoiceResultType.MarkProcessedAsPaid:
      case ProcessPendingInvoiceResultType.MarkProcessedAsPaidWithError:
      case ProcessPendingInvoiceResultType.ReasonInvoiceNotPaidYet:
        return true

      default:
        return assertUnreachable(result)
    }
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
    return ProcessPendingInvoiceResult.err(lndService)
  }

  const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })
  if (lnInvoiceLookup instanceof InvoiceNotFoundError) {
    return ProcessPendingInvoiceResult.processAsCanceledOrExpired(
      ProcessedReason.InvoiceNotFound,
    )
  }
  if (lnInvoiceLookup instanceof Error) {
    return ProcessPendingInvoiceResult.err(lnInvoiceLookup)
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
    return ProcessPendingInvoiceResult.err(invoiceSettled)
  }

  return ProcessPendingInvoiceResult.processAsPaid()
}
