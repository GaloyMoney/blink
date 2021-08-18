import { User } from "@services/mongoose/schema"

import {
  AccountsRepository,
  caseInsensitiveRegex,
  UsersRepository,
} from "@services/mongoose"

export async function usernameExists({ username }): Promise<boolean> {
  return Boolean(await User.findOne({ username: caseInsensitiveRegex(username) }))
}

export const updateUserLevel = async ({ uid, level }) => {
  const user = await User.findOne({ _id: uid })

  user.level = level
  await user.save()
  return user
}

export const updateUserAccountStatus = async ({ uid, status }) => {
  const user = await User.findOne({ _id: uid })

  user.status = status
  await user.save()
  return user
}

export const updateMerchantMapInfo = async ({ username, latitude, longitude, title }) => {
  const usersRepo = UsersRepository()
  const accountsRepo = AccountsRepository()

  const user = await usersRepo.findByUsername(username)
  if (user instanceof Error) throw user

  user.coordinate = {
    latitude,
    longitude,
  }

  user.title = title

  const persistedUser = await usersRepo.update(user)
  if (persistedUser instanceof Error) throw persistedUser

  const defaultAccount = await accountsRepo.findById(user.defaultAccountId)
  if (defaultAccount instanceof Error) throw defaultAccount

  return {
    ...persistedUser,
    level: defaultAccount.level,
    status: defaultAccount.status,
    created_at: persistedUser.createdAt,
  }
}
