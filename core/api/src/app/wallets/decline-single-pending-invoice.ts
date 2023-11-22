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
    const { pubkey, paymentHash } = walletInvoice
    addAttributesToCurrentSpan({ paymentHash, pubkey })

    const lndService = LndService()
    if (lndService instanceof Error) return lndService

    const walletInvoicesRepo = WalletInvoicesRepository()

    const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })

    const pendingInvoiceLogger = logger.child({
      hash: paymentHash,
      pubkey,
      lnInvoiceLookup,
      topic: "payment",
      protocol: "lightning",
      transactionType: "receipt",
      onUs: false,
    })

    if (lnInvoiceLookup instanceof InvoiceNotFoundError) {
      const processingCompletedInvoice =
        await walletInvoicesRepo.markAsProcessingCompleted(paymentHash)
      if (processingCompletedInvoice instanceof Error) {
        pendingInvoiceLogger.error("Unable to mark invoice as processingCompleted")
        return processingCompletedInvoice
      }
      return false
    }
    if (lnInvoiceLookup instanceof Error) return lnInvoiceLookup

    if (lnInvoiceLookup.isSettled) {
      return new InvalidNonHodlInvoiceError(
        JSON.stringify({ paymentHash: lnInvoiceLookup.paymentHash }),
      )
    }

    if (!lnInvoiceLookup.isHeld) {
      pendingInvoiceLogger.info({ lnInvoiceLookup }, "invoice has not been paid yet")
      return false
    }

    let heldForMsg = ""
    if (lnInvoiceLookup.heldAt) {
      heldForMsg = `for ${elapsedSinceTimestamp(lnInvoiceLookup.heldAt)}s `
    }
    pendingInvoiceLogger.error(
      { lnInvoiceLookup },
      `invoice has been held ${heldForMsg}and is now been cancelled`,
    )

    const invoiceSettled = await lndService.cancelInvoice({ pubkey, paymentHash })
    if (invoiceSettled instanceof Error) return invoiceSettled

    const processingCompletedInvoice =
      await walletInvoicesRepo.markAsProcessingCompleted(paymentHash)
    if (processingCompletedInvoice instanceof Error) {
      pendingInvoiceLogger.error("Unable to mark invoice as processingCompleted")
    }

    return true
  },
})
