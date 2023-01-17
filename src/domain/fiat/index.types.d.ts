type UsdCents = number & { readonly brand: unique symbol }
type CentsPerSatsRatio = number & { readonly brand: unique symbol }
type DisplayCurrencyBaseAmount = number & { readonly brand: unique symbol }
type DisplayCurrency =
  | typeof import(".").DisplayCurrency[keyof typeof import(".").DisplayCurrency]
  | (string & { readonly brand: unique symbol })

// TODO: a better way to type it can be:
// <T extends Satoshis | UsdCents> someFunction({amount}: {amount: T})
type CurrencyBaseAmount = Satoshis | UsdCents

interface CurrencyConverter {
  fromSatsToCents: (amount: Satoshis) => UsdCents
  fromCentsToSats: (amount: UsdCents) => Satoshis
}

type GetPriceFnArgs = { currency: DisplayCurrency }
type GetPriceFn = (args: GetPriceFnArgs) => Promise<DisplayCurrencyPerSat | Error>

interface DisplayCurrencyConverter {
  fromBtcAmount: (amount: BtcPaymentAmount) => Promise<DisplayCurrencyBaseAmount | Error>
  fromUsdAmount: (amount: UsdPaymentAmount) => Promise<DisplayCurrencyBaseAmount | Error>
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
