import { User } from "@services/mongoose/schema"
import { baseLogger } from "@services/logger"

import { NotFoundError } from "@core/error"
import { caseInsensitiveRegex } from "@services/mongoose"

const logger = baseLogger.child({ module: "admin" })

export async function usernameExists({ username }): Promise<boolean> {
  return Boolean(await User.findOne({ username: caseInsensitiveRegex(username) }))
}

export const updateUserLevel = async ({ uid, level }): Promise<UserType | Error> => {
  try {
    const user = await User.findOne({ _id: uid })

    if (!user) {
      throw new NotFoundError("User not found", { logger })
    }

    user.level = level
    await user.save()
    return user
  } catch (err) {
    return err
  }
}

export const updateUserAccountStatus = async ({
  uid,
  status,
}): Promise<UserType | Error> => {
  try {
    const user = await User.findOne({ _id: uid })

    if (!user) {
      throw new NotFoundError("User not found", { logger })
    }

    user.status = status
    await user.save()
    return user
  } catch (err) {
    return err
  }
}

export const updateBusinessMapInfo = async ({
  username,
  latitude,
  longitude,
  title,
}): Promise<UserType | Error> => {
  try {
    const user = await User.getUserByUsername(username)

    if (!user) {
      throw new NotFoundError("User not found", { logger })
    }

    user.coordinate = {
      latitude,
      longitude,
    }

    user.title = title
    await user.save()
    return user
  } catch (err) {
    return err
  }
}
