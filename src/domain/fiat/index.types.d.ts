type UsdCents = number & { readonly brand: unique symbol }
type CentsPerSatsRatio = number & { readonly brand: unique symbol }
type DisplayCurrencyBaseAmount = number & { readonly brand: unique symbol }
type DisplayCurrency =
  | typeof import(".").DisplayCurrency[keyof typeof import(".").DisplayCurrency]
  | (string & { readonly brand: unique symbol })
type CurrencyMajorExponent =
  typeof import("./index").MajorExponent[keyof typeof import("./index").MajorExponent]

// TODO: a better way to type it can be:
// <T extends Satoshis | UsdCents> someFunction({amount}: {amount: T})
type CurrencyBaseAmount = Satoshis | UsdCents

interface AmountFromSatoshis {
  sats: Satoshis
}

interface AmountFromCents {
  cents: UsdCents
}

type CentsXORSats = XOR<AmountFromSatoshis, AmountFromCents>

type OrderType =
  typeof import("./index").OrderType[keyof typeof import("./index").OrderType]

type GetAmountsSendOrReceiveArgs = {
  walletCurrency: WalletCurrency
  order: OrderType
} & CentsXORSats

type GetAmountsSendOrReceiveRet =
  | {
      amountDisplayCurrency: DisplayCurrencyBaseAmount
      sats: Satoshis
      cents?: UsdCents
    }
  | NotReachableError
  | NotImplementedError
  | DealerPriceServiceError
