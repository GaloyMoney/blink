import { declineHeldInvoice } from "./decline-single-pending-invoice"

import { updatePendingInvoice } from "./update-single-pending-invoice"

import { WalletInvoicesRepository } from "@/services/mongoose"

import { runInParallel } from "@/utils"
import { WalletInvoiceChecker } from "@/domain/wallet-invoices"

export const handleHeldInvoices = async (logger: Logger): Promise<void> => {
  const pendingInvoices = WalletInvoicesRepository().yieldPending()
  if (pendingInvoices instanceof Error) {
    logger.error(
      { error: pendingInvoices },
      "finish updating pending invoices with error",
    )
    return
  }

  await runInParallel({
    iterator: pendingInvoices,
    logger,
    processor: async (
      walletInvoice: WalletInvoiceWithOptionalLnInvoice,
      index: number,
    ) => {
      logger.trace("updating pending invoices %s in worker %d", index)

      return WalletInvoiceChecker(walletInvoice).shouldDecline()
        ? declineHeldInvoice({ walletInvoice, logger })
        : updatePendingInvoice({ walletInvoice, logger })
    },
  })

  logger.info("finish updating pending invoices")
}

export const handleHeldInvoiceByPaymentHash = async ({
  paymentHash,
  logger,
}: {
  paymentHash: PaymentHash
  logger: Logger
}): Promise<boolean | ApplicationError> => {
  const walletInvoice = await WalletInvoicesRepository().findByPaymentHash(paymentHash)
  if (walletInvoice instanceof Error) return walletInvoice

  return WalletInvoiceChecker(walletInvoice).shouldDecline()
    ? declineHeldInvoice({ walletInvoice, logger })
    : updatePendingInvoice({ walletInvoice, logger })
}
