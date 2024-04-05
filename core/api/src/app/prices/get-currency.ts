import { listCurrencies } from "./list-currencies"

import { checkedToDisplayCurrency } from "@/domain/fiat"
import { InvalidPriceCurrencyError } from "@/domain/price"

export const getCurrency = async ({
  currency,
}: GetCurrencyArgs): Promise<PriceCurrency | ApplicationError> => {
  const checkedDisplayCurrency = checkedToDisplayCurrency(currency)
  if (checkedDisplayCurrency instanceof Error) return checkedDisplayCurrency

  const currencies = await listCurrencies()
  if (currencies instanceof Error) return currencies

  const priceCurrency = currencies.find(
    (c) => c.code.toUpperCase() === checkedDisplayCurrency,
  )
  if (!priceCurrency) return new InvalidPriceCurrencyError()

  return priceCurrency
}
