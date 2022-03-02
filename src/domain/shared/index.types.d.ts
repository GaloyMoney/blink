type WalletCurrency =
  typeof import("./primitives").WalletCurrency[keyof typeof import("./primitives").WalletCurrency]

type PaymentAmount<T extends WalletCurrency> = {
  currency: T
  amount: bigint
}
