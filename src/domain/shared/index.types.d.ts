type ErrorLevel =
  typeof import("./errors").ErrorLevel[keyof typeof import("./errors").ErrorLevel]
type ValidationError = import("./errors").ValidationError
type BigIntConversionError = import("./errors").BigIntConversionError

type WalletCurrency =
  typeof import("./primitives").WalletCurrency[keyof typeof import("./primitives").WalletCurrency]

type ExchangeCurrencyUnit =
  typeof import("./primitives").ExchangeCurrencyUnit[keyof typeof import("./primitives").ExchangeCurrencyUnit]

type PaymentAmount<T extends WalletCurrency> = {
  currency: T
  amount: bigint
}

type DisplayPaymentAmount<T extends DisplayCurrency> = {
  currency: T
  amount: number
}

type WalletDescriptor<T extends WalletCurrency> = {
  id: WalletId
  currency: T
}

type BtcPaymentAmount = PaymentAmount<"BTC">
type UsdPaymentAmount = PaymentAmount<"USD">

type RequireField<T, K extends keyof T> = T & Required<Pick<T, K>>

type AmountCalculator = {
  add: <T extends WalletCurrency>(
    a: PaymentAmount<T>,
    b: PaymentAmount<T>,
  ) => PaymentAmount<T>
  sub: <T extends WalletCurrency>(
    a: PaymentAmount<T>,
    b: PaymentAmount<T>,
  ) => PaymentAmount<T>
  div: <T extends WalletCurrency>(a: PaymentAmount<T>, b: bigint) => PaymentAmount<T>
}
