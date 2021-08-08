declare const paymentHashSymbol: unique symbol
type PaymentHash = string & { [paymentHashSymbol]: never }

declare const paymentSecretSymbol: unique symbol
type PaymentSecret = string & { [paymentSecretSymbol]: never }

type LnInvoice = {
  readonly paymentHash: PaymentHash
  readonly paymentSecret: PaymentSecret
}
