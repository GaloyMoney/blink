import { listCurrencies } from "@app/prices"

import { InvalidPriceCurrencyError } from "@domain/price"

import { AccountsRepository } from "@services/mongoose"

export const updateDisplayCurrency = async ({
  accountId,
  currency,
}: {
  accountId: AccountId
  currency: string
}): Promise<Account | ApplicationError> => {
  const currencies = await listCurrencies()
  if (currencies instanceof Error) return currencies

  const exists = currencies.find((c) => c.code.toUpperCase() === currency.toUpperCase())
  if (!exists) return new InvalidPriceCurrencyError()

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  account.displayCurrency = currency

  return AccountsRepository().update(account)
}
