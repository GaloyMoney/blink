import { SECS_PER_2_MINS, SECS_PER_DAY } from "@config"

const DEFAULT_EXPIRATIONS = {
  BTC: { delay: SECS_PER_DAY },
  USD: { delay: SECS_PER_2_MINS },
}

export const invoiceExpirationForCurrency = (
  currency: WalletCurrency,
  now: Date,
): InvoiceExpiration => {
  const { delay } = DEFAULT_EXPIRATIONS[currency]
  const expirationTimestamp = now.getTime() + delay * 1000
  return new Date(expirationTimestamp) as InvoiceExpiration
}
