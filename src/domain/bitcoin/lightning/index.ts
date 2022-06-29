import { InvalidPubKeyError } from "@domain/errors"

export { decodeInvoice } from "./ln-invoice"
export {
  invoiceExpirationForCurrency,
  defaultTimeToExpiryInSeconds,
} from "./invoice-expiration"
export * from "./fee-calculator"
export * from "./errors"

export const PaymentStatus = {
  Settled: "settled",
  Failed: "failed",
  Pending: "pending",
} as const

export const PaymentSendStatus = {
  Success: { value: "success" },
  Failure: { value: "failed" },
  Pending: { value: "pending" },
  AlreadyPaid: { value: "already_paid" },
} as const

const pubkeyRegex = /^[a-f0-9]{66}$/i
export const checkedToPubkey = (pubkey: string): Pubkey | InvalidPubKeyError => {
  if (pubkey.match(pubkeyRegex)) {
    return pubkey as Pubkey
  }
  return new InvalidPubKeyError("Pubkey conversion error")
}
