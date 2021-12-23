import { toSeconds } from "@domain/primitives"

const DEFAULT_EXPIRATIONS = {
  BTC: { delay: toSeconds(60 * 60 * 24) },
  USD: { delay: toSeconds(2 * 60) },
}

export const invoiceExpirationForCurrency = (
  currency: TxDenominationCurrency,
  now: Date,
): InvoiceExpiration => {
  const { delay } = DEFAULT_EXPIRATIONS[currency]
  const expirationTimestamp = now.getTime() + delay * 1000
  return new Date(expirationTimestamp) as InvoiceExpiration
}
