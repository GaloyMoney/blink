type ErrorLevel =
  typeof import("./errors").ErrorLevel[keyof typeof import("./errors").ErrorLevel]
type ValidationError = import("./errors").ValidationError

type WalletCurrency =
  typeof import("./primitives").WalletCurrency[keyof typeof import("./primitives").WalletCurrency]

type ExchangeCurrencyUnit =
  typeof import("./primitives").ExchangeCurrencyUnit[keyof typeof import("./primitives").ExchangeCurrencyUnit]

type PaymentAmount<T extends WalletCurrency> = {
  currency: T
  amount: bigint
}

type PaymentAmountPayload<T extends ExchangeCurrencyUnit> = {
  currencyUnit: T
  amount: number
}

type WalletDescriptor<T extends WalletCurrency> = {
  id: WalletId
  currency: T
}

type BtcPaymentAmount = PaymentAmount<"BTC">
type UsdPaymentAmount = PaymentAmount<"USD">

type RequireField<T, K extends keyof T> = T & Required<Pick<T, K>>
