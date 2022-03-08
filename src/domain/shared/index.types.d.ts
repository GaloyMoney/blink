type ErrorLevel =
  typeof import("./errors").ErrorLevel[keyof typeof import("./errors").ErrorLevel]

type WalletCurrency =
  typeof import("./primitives").WalletCurrency[keyof typeof import("./primitives").WalletCurrency]

type PaymentAmount<T extends WalletCurrency> = {
  currency: T
  amount: bigint
}

type BtcPaymentAmount = PaymentAmount<"BTC">
type UsdPaymentAmount = PaymentAmount<"USD">
