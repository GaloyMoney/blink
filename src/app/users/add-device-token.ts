import { checkedToDeviceToken } from "@domain/users"
import { UsersRepository } from "@services/mongoose/users"

type AddDeviceTokenArgs = {
  kratosUserId: KratosUserId
  deviceToken: string
}

export const addDeviceToken = async ({
  kratosUserId,
  deviceToken,
}: AddDeviceTokenArgs): Promise<User | ApplicationError> => {
  const users = UsersRepository()

  const deviceTokenChecked = checkedToDeviceToken(deviceToken)
  if (deviceTokenChecked instanceof Error) return deviceTokenChecked

  const user = await users.findById(kratosUserId)
  if (user instanceof Error) return user

  const deviceTokens = user.deviceTokens

  if (!deviceTokens.includes(deviceTokenChecked)) {
    deviceTokens.push(deviceTokenChecked)
  }

  return users.update({ ...user, deviceTokens })
}
