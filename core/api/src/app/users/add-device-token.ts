import { checkedToDeviceToken } from "@/domain/users"
import { UsersRepository } from "@/services/mongoose"
import { NotificationsService } from "@/services/notifications"

export const addDeviceToken = async ({
  userId,
  deviceToken,
}: AddDeviceTokenArgs): Promise<User | ApplicationError> => {
  const users = UsersRepository()
  const notificationsService = NotificationsService()

  const deviceTokenChecked = checkedToDeviceToken(deviceToken)
  if (deviceTokenChecked instanceof Error) return deviceTokenChecked

  const user = await users.findById(userId)
  if (user instanceof Error) return user

  const res = await notificationsService.addPushDeviceToken({
    userId: user.id,
    deviceToken: deviceTokenChecked,
  })

  if (res instanceof Error) return res

  return user
}
