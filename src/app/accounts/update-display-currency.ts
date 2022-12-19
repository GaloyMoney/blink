import { AccountsRepository } from "@services/mongoose"

export const updateDisplayCurrency = async ({
  accountId,
  currency,
}: {
  accountId: AccountId
  currency: string
}): Promise<Account | ApplicationError> => {
  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  // TODO: validate against price service available currencies

  account.displayCurrency = currency

  return AccountsRepository().update(account)
}
