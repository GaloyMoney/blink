import { toSeconds } from "@/domain/primitives"

const SECS_PER_MIN = toSeconds(60)
const SECS_PER_5_MINS = toSeconds(60 * 5)
const SECS_PER_HOUR = toSeconds(60 * 60)
const SECS_PER_2_HOURS = toSeconds(SECS_PER_HOUR * 2)
const SECS_PER_4_HOURS = toSeconds(SECS_PER_HOUR * 4)
const SECS_PER_DAY = toSeconds(SECS_PER_HOUR * 24)

export const defaultTimeToExpiryInSeconds = SECS_PER_5_MINS

export const INVOICE_EXPIRATIONS = {
  BTC: {
    min: SECS_PER_MIN,
    max: SECS_PER_DAY,
    defaultValue: SECS_PER_4_HOURS,
    defaultValueNoAmount: SECS_PER_2_HOURS,
  },
  USD: {
    min: SECS_PER_MIN,
    max: SECS_PER_5_MINS,
    defaultValue: SECS_PER_5_MINS,
    defaultValueNoAmount: SECS_PER_5_MINS,
  },
}

export const invoiceExpirationForCurrency = (
  currency: WalletCurrency,
  now: Date,
  delay?: Seconds,
): InvoiceExpiration => {
  let expirationDelay = delay || toSeconds(0)
  const { min, max, defaultValue } = INVOICE_EXPIRATIONS[currency]
  const isValidExpiration = expirationDelay >= min && expirationDelay <= max
  if (!isValidExpiration) {
    expirationDelay = defaultValue
  }

  const expirationTimestamp = now.getTime() + expirationDelay * 1000
  return new Date(expirationTimestamp) as InvoiceExpiration
}
