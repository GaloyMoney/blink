import { LndService } from "@services/lnd"
import { offchainLnds } from "@services/lnd/utils"
import { InvoiceNotFoundError } from "@domain/bitcoin/lightning"

export const lookupInvoiceByHash = async (
  paymentHash: PaymentHash,
): Promise<LnInvoiceLookup | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  for (const { pubkey } of offchainLnds) {
    const invoice = await lndService.lookupInvoice({
      pubkey: pubkey as Pubkey,
      paymentHash,
    })
    if (invoice instanceof Error) continue
    return invoice
  }

  return new InvoiceNotFoundError("Invoice not found")
}
