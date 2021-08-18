import { levels } from "@config/app"

import { User } from "@services/mongoose/schema"
import { baseLogger } from "@services/logger"

import { ValidationInternalError } from "./error"
import { UsersRepository } from "@services/mongoose"

const logger = baseLogger.child({ module: "admin" })

export const setLevel = async ({ uid, level }) => {
  if (levels.indexOf(level) === -1) {
    const error = `${level} is not a valid user level`
    throw new ValidationInternalError(error, {
      forwardToClient: true,
      logger,
      level: "warn",
    })
  }
  return User.findOneAndUpdate({ _id: uid }, { $set: { level } }, { new: true })
}

export const addToMap = async ({
  username,
  latitude,
  longitude,
  title,
  logger,
}): Promise<boolean> => {
  if (!username || !latitude || !longitude || !title) {
    throw new ValidationInternalError(
      `username, latitude, longitude and title are all required arguments`,
      { logger },
    )
  }

  const usersRepo = UsersRepository()
  const user = await usersRepo.findByUsername(username)
  if (user instanceof Error) throw user

  user.coordinate = {
    latitude,
    longitude,
  }

  user.title = title

  const persistResult = await usersRepo.update(user)
  if (persistResult instanceof Error) throw persistResult

  return true
}

export const setAccountStatus = async ({ uid, status }): Promise<typeof User> => {
  const user = await User.findOne({ _id: uid })

  user.status = status
  return user.save()
}
