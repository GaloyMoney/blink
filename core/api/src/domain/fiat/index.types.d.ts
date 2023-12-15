type UsdCents = number & { readonly brand: unique symbol }
type CentsPerSatsRatio = number & { readonly brand: unique symbol }
type DisplayCurrencyBaseAmount = number & { readonly brand: unique symbol }
type DisplayCurrency = string & { readonly brand: unique symbol }
type CurrencyMajorExponent =
  (typeof import("./index").MajorExponent)[keyof typeof import("./index").MajorExponent]

type DisplayTxnAmounts = {
  displayAmount: DisplayCurrencyBaseAmount
  displayFee: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
}

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
  (typeof import("./index").OrderType)[keyof typeof import("./index").OrderType]

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

type DisplayAmountsConverter<D extends DisplayCurrency> = {
  convert: (args: AmountsAndFees) => {
    displayAmount: DisplayAmount<D>
    displayFee: DisplayAmount<D>
    displayCurrency: D
    displayPrice: WalletMinorUnitDisplayPrice<"BTC", D>
  }
}
