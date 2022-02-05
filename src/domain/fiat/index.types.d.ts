type UsdCents = bigint & { readonly brand: unique symbol }
type DisplayCurrencyBaseAmount = number & { readonly brand: unique symbol }

type CurrencyBaseAmount = Satoshis | UsdCents

interface DisplayCurrencyConversionRate {
  fromSats: (amount: Satoshis) => DisplayCurrencyBaseAmount
  fromCents: (amount: UsdCents) => DisplayCurrencyBaseAmount
}

interface DealerFns {
  buyUsd: (amount: Satoshis) => Promise<UsdCents>
  buyUsdFromCents: (amount: UsdCents) => Promise<Satoshis>
  sellUsd: (amount: UsdCents) => Promise<Satoshis>
  sellUsdFromSats: (amount: Satoshis) => Promise<UsdCents>
}

type GetAmountsSendOrReceiveArgs =
  | {
      walletCurrency: WalletCurrency
      sats: Satoshis
      cents?: never
    }
  | {
      walletCurrency: WalletCurrency
      sats?: never
      cents: UsdCents
    }
