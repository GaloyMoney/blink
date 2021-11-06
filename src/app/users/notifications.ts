import { ValidationError } from "@domain/errors"

export const enableNotifications = async ({
  user,
  deviceToken,
  notificationKeys,
}): Promise<true | Error> => {
  // TODO: support notification keys
  if (!notificationKeys.includes("ALL_NOTIFICATIONS")) {
    return new ValidationError()
  }

  try {
    user.deviceToken.addToSet(deviceToken)
    await user.save()
    return true
  } catch (err) {
    return err
  }
}

export const disableNotifications = async ({
  user,
  notificationKeys,
}): Promise<true | Error> => {
  // TODO: support notification keys
  if (!notificationKeys.includes("ALL_NOTIFICATIONS")) {
    return new ValidationError()
  }
  try {
    user.deviceToken = []
    await user.save()
    return true
  } catch (err) {
    return err
  }
}
