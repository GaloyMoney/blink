import { deleteMerchantByUsername } from "@/app/merchants"

import { getBalanceForWallet, listWalletsByAccountId } from "@/app/wallets"

import { AccountStatus, AccountValidator } from "@/domain/accounts"
import { AccountHasPositiveBalanceError } from "@/domain/authentication/errors"

import { IdentityRepository } from "@/services/kratos"
import { addEventToCurrentSpan } from "@/services/tracing"
import { AccountsRepository, UsersRepository } from "@/services/mongoose"

export const markAccountForDeletion = async ({
  accountId,
  cancelIfPositiveBalance = false,
  updatedByPrivilegedClientId,
}: {
  accountId: AccountId
  cancelIfPositiveBalance?: boolean
  updatedByPrivilegedClientId?: PrivilegedClientId
}): Promise<true | ApplicationError> => {
  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findById(accountId)
  if (account instanceof Error) return account
  const accountValidator = AccountValidator(account)
  if (accountValidator instanceof Error) return accountValidator

  const wallets = await listWalletsByAccountId(account.id)
  if (wallets instanceof Error) return wallets

  for (const wallet of wallets) {
    const balance = await getBalanceForWallet({ walletId: wallet.id })
    if (balance instanceof Error) return balance
    if (balance > 0 && cancelIfPositiveBalance) {
      return new AccountHasPositiveBalanceError(
        `The new phone is associated with an account with a non empty wallet. walletId: ${wallet.id}, balance: ${balance}, accountId: ${account.id}, cancelIfPositiveBalance: ${cancelIfPositiveBalance}`,
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

  account.statusHistory = (account.statusHistory ?? []).concat({
    status: AccountStatus.Closed,
    updatedByPrivilegedClientId,
  })

  if (account.username) {
    await deleteMerchantByUsername({ username: account.username })
  }

  const newAccount = await accountsRepo.update(account)
  if (newAccount instanceof Error) return newAccount

  const identities = IdentityRepository()
  const deletionResult = await identities.deleteIdentity(kratosUserId)
  if (deletionResult instanceof Error) return deletionResult

  return true
}
