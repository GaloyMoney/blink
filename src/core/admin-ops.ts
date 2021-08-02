import { levels } from "@config/app"

import { User } from "@services/mongoose/schema"
import { baseLogger } from "@services/logger"

import { NotFoundError, ValidationInternalError } from "./error"

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
  const user = await User.findOneAndUpdate(
    { _id: uid },
    { $set: { level } },
    { new: true },
  )
  return user
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

  const user = await User.getUserByUsername(username)

  if (!user) {
    throw new NotFoundError(`The user ${username} does not exist`, { logger })
  }

  user.coordinate = {
    latitude,
    longitude,
  }

  user.title = title
  return !!(await user.save())
}

export const setAccountStatus = async ({ uid, status }): Promise<typeof User> => {
  const user = await User.findOne({ _id: uid })

  user.status = status
  return user.save()
}
