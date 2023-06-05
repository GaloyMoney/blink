import { AccountLevel } from "@domain/accounts"
import { AccountsRepository, UsersRepository } from "@services/mongoose"

export const upgradeAccountFromDeviceToPhone = async ({
  userId,
  deviceId,
  phone,
}: {
  userId: UserId
  deviceId: UserId
  phone: PhoneNumber
}): Promise<Account | RepositoryError> => {
  // TODO: ideally both 1. and 2. should be done in a transaction,
  // so that if one fails, the other is rolled back

  // 1. update account
  const accountDevice = await AccountsRepository().findByUserId(deviceId)
  if (accountDevice instanceof Error) return accountDevice
  accountDevice.kratosUserId = userId
  accountDevice.level = AccountLevel.One
  const accountUpdated = await AccountsRepository().update(accountDevice)
  if (accountUpdated instanceof Error) return accountUpdated

  // 2. update user
  const userUpdated = await UsersRepository().migrateUserIdSubject({
    currentUserIdSubject: deviceId,
    newUserIdSubject: userId,
    phone, // TODO: we are fetching phone metadata in the "normal" flow. Not sure we're doing it in this upgrade path
  })
  if (userUpdated instanceof Error) return userUpdated

  return accountUpdated
}
