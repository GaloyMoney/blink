import { listCurrencies } from "@/app/prices"

import { checkedToDisplayCurrency } from "@/domain/fiat"
import { InvalidPriceCurrencyError } from "@/domain/price"

import { AccountsRepository } from "@/services/mongoose"

export const updateDisplayCurrency = async ({
  accountId,
  currency,
}: {
  accountId: AccountId
  currency: string
}): Promise<Account | ApplicationError> => {
  const checkedDisplayCurrency = checkedToDisplayCurrency(currency)
  if (checkedDisplayCurrency instanceof Error) return checkedDisplayCurrency

  const currencies = await listCurrencies()
  if (currencies instanceof Error) return currencies

  const exists = currencies.find((c) => c.code.toUpperCase() === checkedDisplayCurrency)
  if (!exists) return new InvalidPriceCurrencyError()

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  account.displayCurrency = checkedDisplayCurrency

  return AccountsRepository().update(account)
}
