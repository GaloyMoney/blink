import { createHash, randomBytes } from "crypto"

export { decodeInvoice } from "./ln-invoice"
export { invoiceExpirationForCurrency } from "./invoice-expiration"
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

export const lnPaymentStatusEvent = (paymentHash: PaymentHash) =>
  `LN-PAYMENT-STATUS-${paymentHash}`

const sha256 = (buffer: Buffer) => createHash("sha256").update(buffer).digest("hex")
const randomSecret = () => randomBytes(32)

export const getSecretAndPaymentHash = () => {
  const secret = randomSecret()
  const paymentHash = sha256(secret) as PaymentHash

  return { secret: secret.toString("hex") as SecretPreImage, paymentHash }
}
