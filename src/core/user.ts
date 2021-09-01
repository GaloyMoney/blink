import { User } from "@services/mongoose/schema"
import { baseLogger } from "@services/logger"

import { NotFoundError } from "@core/error"
import { caseInsensitiveRegex } from "@services/mongoose"

const logger = baseLogger.child({ module: "admin" })

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

export const updateBusinessMapInfo = async ({
  walletName,
  latitude,
  longitude,
  title,
}) => {
  const user = await User.getUserByUsername(walletName)

  if (!user) {
    throw new NotFoundError(`The wallet ${walletName} does not exist`, { logger })
  }

  user.coordinate = {
    latitude,
    longitude,
  }

  user.title = title
  await user.save()
  return user
}
