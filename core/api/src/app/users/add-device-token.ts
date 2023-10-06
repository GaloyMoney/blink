import { checkedToDeviceToken } from "@/domain/users"
import { UsersRepository } from "@/services/mongoose"

export const addDeviceToken = async ({
  userId,
  deviceToken,
}: AddDeviceTokenArgs): Promise<User | ApplicationError> => {
  const users = UsersRepository()

  const deviceTokenChecked = checkedToDeviceToken(deviceToken)
  if (deviceTokenChecked instanceof Error) return deviceTokenChecked

  const user = await users.findById(userId)
  if (user instanceof Error) return user

  const deviceTokens = user.deviceTokens

  if (!deviceTokens.includes(deviceTokenChecked)) {
    deviceTokens.push(deviceTokenChecked)
  }

  return users.update({ ...user, deviceTokens })
}
