import { UsernameRegex } from "@/domain/accounts"
import { mapError } from "@/graphql/error-map"
import { AccountsRepository, UsersRepository } from "@/services/mongoose"

export const getAccountByUsernameOrPhone = async (
  value: Username | PhoneNumber,
): Promise<Account> => {
  let account: Account | RepositoryError

  if (value.match(UsernameRegex)) {
    account = await AccountsRepository().findByUsername(value as Username)
  } else {
    const user = await UsersRepository().findByPhone(value as PhoneNumber)
    if (user instanceof Error) throw mapError(user)

    account = await AccountsRepository().findByUserId(user.id)
  }

  if (account instanceof Error) throw mapError(account)

  return account
}
