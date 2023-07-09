import { getBalanceForWallet, listWalletsByAccountId } from "@app/wallets"
import { AccountHasPositiveBalanceError } from "@domain/authentication/errors"
import { IdentityRepository } from "@services/kratos"
import { AccountsRepository, UsersRepository } from "@services/mongoose"
import { addEventToCurrentSpan } from "@services/tracing"

export const markAccountForDeletion = async ({
  accountId,
  cancelIfPositiveBalance = false,
}: {
  accountId: AccountId
  cancelIfPositiveBalance?: boolean
}): Promise<true | ApplicationError> => {
  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findById(accountId)
  if (account instanceof Error) return account

  const wallets = await listWalletsByAccountId(account.id)
  if (wallets instanceof Error) return wallets

  for (const wallet of wallets) {
    const balance = await getBalanceForWallet({ walletId: wallet.id })
    if (balance instanceof Error) return balance
    if (balance > 0 && cancelIfPositiveBalance) {
      return new AccountHasPositiveBalanceError(
        "The new phone is associated with an account with a non empty wallet",
      )
    }
    addEventToCurrentSpan(`deleting_wallet`, {
      walletId: wallet.id,
      currency: wallet.currency,
      balance,
    })
  }

  const { kratosUserId } = account

  const usersRepo = UsersRepository()
  const user = await usersRepo.findById(kratosUserId)
  if (user instanceof Error) return user

  if (user.phone) {
    const newUser = {
      ...user,
      deletedPhones: user.deletedPhones
        ? [...user.deletedPhones, user.phone]
        : [user.phone],
      phone: undefined,
    }
    const result = await usersRepo.update(newUser)
    if (result instanceof Error) return result
  }

  const identityRepo = IdentityRepository()
  const deletionResult = await identityRepo.deleteIdentity(kratosUserId)
  if (deletionResult instanceof Error) return deletionResult

  return true
}
