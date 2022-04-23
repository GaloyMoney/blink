const SECS_PER_5_MINS = (60 * 5) as Seconds
const SECS_PER_DAY = (60 * 60 * 24) as Seconds

export const defaultTimeToExpiryInSeconds = SECS_PER_5_MINS

const DEFAULT_EXPIRATIONS = {
  BTC: { delay: SECS_PER_DAY },
  USD: { delay: defaultTimeToExpiryInSeconds },
}

export const invoiceExpirationForCurrency = (
  currency: WalletCurrency,
  now: Date,
): InvoiceExpiration => {
  const { delay } = DEFAULT_EXPIRATIONS[currency]
  const expirationTimestamp = now.getTime() + delay * 1000
  return new Date(expirationTimestamp) as InvoiceExpiration
}
