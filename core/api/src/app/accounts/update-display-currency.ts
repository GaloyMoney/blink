import { getCurrency } from "@/app/prices"

import { AccountsRepository } from "@/services/mongoose"

export const updateDisplayCurrency = async ({
  accountId,
  currency,
}: {
  accountId: AccountId
  currency: string
}): Promise<Account | ApplicationError> => {
  const priceCurrency = await getCurrency({ currency })
  if (priceCurrency instanceof Error) return priceCurrency

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  account.displayCurrency = priceCurrency.code

  return AccountsRepository().update(account)
}
