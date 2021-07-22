import { NotFoundError, ValidationInternalError } from "./error"
import { User } from "./schema"
import { Levels } from "./types"
import { baseLogger } from "./logger"

const logger = baseLogger.child({ module: "admin" })

export const usernameExists = async ({ username }): Promise<boolean> => {
  return !!(await User.findByUsername({ username }))
}

export const setLevel = async ({ uid, level }) => {
  if (Levels.indexOf(level) === -1) {
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

  const user = await User.findByUsername({ username })

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
