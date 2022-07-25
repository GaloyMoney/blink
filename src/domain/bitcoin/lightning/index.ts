import { createHash, randomBytes } from "crypto"

import { InvalidPubKeyError } from "@domain/errors"

export { decodeInvoice } from "./ln-invoice"
export {
  invoiceExpirationForCurrency,
  defaultTimeToExpiryInSeconds,
} from "./invoice-expiration"
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

export const sha256 = (buffer: Buffer) =>
  createHash("sha256").update(buffer).digest("hex")
const randomSecret = () => randomBytes(32)

export const getSecretAndPaymentHash = () => {
  const secret = randomSecret()
  const paymentHash = sha256(secret) as PaymentHash

  return { secret: secret.toString("hex") as SecretPreImage, paymentHash }
}
