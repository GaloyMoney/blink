import { toSeconds } from "@/domain/primitives"

const SECS_PER_MIN = toSeconds(60)
const SECS_PER_5_MINS = toSeconds(60 * 5)
const SECS_PER_DAY = toSeconds(60 * 60 * 24)

export const defaultTimeToExpiryInSeconds = SECS_PER_5_MINS

export const DEFAULT_EXPIRATIONS = {
  BTC: { delay: SECS_PER_DAY, delayMinutes: (SECS_PER_DAY / SECS_PER_MIN) as Minutes },
  USD: {
    delay: defaultTimeToExpiryInSeconds,
    delayMinutes: (defaultTimeToExpiryInSeconds / SECS_PER_MIN) as Minutes,
  },
}

export const invoiceExpirationForCurrency = (
  currency: WalletCurrency,
  now: Date,
  delay?: Seconds,
): InvoiceExpiration => {
  let expirationDelay = delay || toSeconds(0)
  const { delay: defaultDelay } = DEFAULT_EXPIRATIONS[currency]
  if (expirationDelay < SECS_PER_MIN || expirationDelay > defaultDelay) {
    expirationDelay = defaultDelay
  }

  const expirationTimestamp = now.getTime() + expirationDelay * 1000
  return new Date(expirationTimestamp) as InvoiceExpiration
}
