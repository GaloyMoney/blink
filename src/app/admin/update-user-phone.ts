import {
  PhoneIdentityDoesNotExistError,
  UserWithPhoneAlreadyExistsError,
} from "@domain/authentication/errors"
import { AuthWithPhonePasswordlessService } from "@services/kratos/auth-phone-no-password"
import { KratosError } from "@services/kratos/errors"
import { IdentityRepository } from "@services/kratos/identity"
import { baseLogger } from "@services/logger"
import { AccountsRepository } from "@services/mongoose/accounts"
import { UsersRepository } from "@services/mongoose/users"

import { getBalanceForWallet, listWalletsByAccountId } from "../wallets"

const deleteUserIfNew = async ({
  kratosUserId,
}: {
  kratosUserId: UserId
}): Promise<void | Error> => {
  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findByUserId(kratosUserId)
  if (account instanceof Error) return account

  const wallets = await listWalletsByAccountId(account.id)
  if (wallets instanceof Error) return wallets

  for (const wallet of wallets) {
    const balance = await getBalanceForWallet({ walletId: wallet.id, logger: baseLogger })
    if (balance instanceof Error) return balance
    if (balance > 0) {
      return new UserWithPhoneAlreadyExistsError(
        "The new phone is associated with an account with a non empty wallet",
      )
    }
  }

  const identityRepo = IdentityRepository()
  const deletionResult = await identityRepo.deleteIdentity(kratosUserId)
  if (deletionResult instanceof Error) return deletionResult

  const usersRepo = UsersRepository()
  const result = await usersRepo.adminUnsetPhoneForUserPreservation(kratosUserId)
  if (result instanceof Error) return result
}

export const updateUserPhone = async ({
  id,
  phone,
}: {
  id: string
  phone: PhoneNumber
}): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findById(id as AccountId)
  if (account instanceof Error) return account
  const kratosUserId = account.kratosUserId

  const identityRepo = IdentityRepository()
  const existingIdentity = await identityRepo.slowFindByPhone(phone)

  if (
    !(existingIdentity instanceof PhoneIdentityDoesNotExistError) &&
    !(existingIdentity instanceof KratosError)
  ) {
    const result = await deleteUserIfNew({ kratosUserId: existingIdentity.id })
    if (result instanceof Error) return result
  }

  const usersRepo = UsersRepository()
  const user = await usersRepo.findById(kratosUserId)
  if (user instanceof Error) return user

  user.phone = phone
  const result = await usersRepo.update(user)
  if (result instanceof Error) return result

  const authService = AuthWithPhonePasswordlessService()
  const kratosResult = await authService.updatePhone({ kratosUserId, phone })
  if (kratosResult instanceof Error) return kratosResult

  return account
}
