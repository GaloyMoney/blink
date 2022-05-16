type UsdCents = number & { readonly brand: unique symbol }
type CentsPerSatsRatio = number & { readonly brand: unique symbol }
type DisplayCurrencyBaseAmount = number & { readonly brand: unique symbol }
type DisplayCurrency =
  typeof import(".").DisplayCurrency[keyof typeof import(".").DisplayCurrency]

// TODO: a better way to type it can be:
// <T extends Satoshis | UsdCents> someFunction({amount}: {amount: T})
type CurrencyBaseAmount = Satoshis | UsdCents

interface DisplayCurrencyConverter {
  fromSats: (amount: Satoshis) => DisplayCurrencyBaseAmount
  fromCents: (amount: UsdCents) => DisplayCurrencyBaseAmount
  fromSatsToCents: (amount: Satoshis) => UsdCents
  fromCentsToSats: (amount: UsdCents) => Satoshis
}

interface NewDisplayCurrencyConverter {
  fromBtcAmount: (amount: BtcPaymentAmount) => DisplayCurrencyBaseAmount
  fromUsdAmount: (amount: UsdPaymentAmount) => DisplayCurrencyBaseAmount
}

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
