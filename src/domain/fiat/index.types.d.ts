type UsdCents = number & { readonly brand: unique symbol }
type DisplayCurrencyBaseAmount = number & { readonly brand: unique symbol }

type CurrencyBaseAmount = Satoshis | UsdCents

interface DisplayCurrencyConversionRate {
  fromSats: (amount: Satoshis) => DisplayCurrencyBaseAmount
  fromCents: (amount: UsdCents) => DisplayCurrencyBaseAmount
}

interface AmountFromSatoshis {
  sats: Satoshis
}

interface AmountFromCents {
  cents: UsdCents
}

type XOR<T1, T2> =
  | (T1 & { [k in Exclude<keyof T2, keyof T1>]?: never })
  | (T2 & { [k in Exclude<keyof T1, keyof T2>]?: never })

type CentsXORSats = XOR<AmountFromSatoshis, AmountFromCents>

type OrderType =
  typeof import("./index").OrderType[keyof typeof import("./index").OrderType]

type GetAmountsSendOrReceiveArgs = {
  walletCurrency: WalletCurrency
  order: OrderType
} & CentsXORSats

type GetAmountsSendOrReceiveRet =
  | NotReachableError
  | NotImplementedError
  | DealerPriceServiceError
  | {
      amountDisplayCurrency: DisplayCurrencyBaseAmount
      sats: Satoshis
      cents?: UsdCents
    }
