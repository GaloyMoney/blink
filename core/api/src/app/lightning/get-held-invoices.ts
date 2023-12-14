import { ErrorLevel, WalletCurrency } from "@/domain/shared"
import { DEFAULT_EXPIRATIONS } from "@/domain/bitcoin/lightning/invoice-expiration"

import { LndService } from "@/services/lnd"
import { recordExceptionInCurrentSpan } from "@/services/tracing"

export const getHeldInvoicesCount = async (): Promise<number | ApplicationError> => {
  const offChainService = LndService()
  if (offChainService instanceof Error) return offChainService

  const { delay } = DEFAULT_EXPIRATIONS[WalletCurrency.Btc]
  const createdAfter = new Date(new Date().getTime() - delay * 2 * 1000)

  const invoices = await Promise.all(
    offChainService.listActivePubkeys().map(async (pubkey) => {
      const result: LnInvoiceLookup[] = []
      const invoices = offChainService.listInvoices({ pubkey, createdAfter })

      if (invoices instanceof Error) {
        recordExceptionInCurrentSpan({ error: result, level: ErrorLevel.Critical })
        return []
      }

      for await (const invoice of invoices) {
        result.push(invoice)
      }
      return result
    }),
  )

  return invoices.flat().filter((i) => i.isHeld).length
}
