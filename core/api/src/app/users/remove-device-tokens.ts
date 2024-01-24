import { UsersRepository } from "@/services/mongoose"
import { NotificationsService } from "@/services/notifications"

export const removeDeviceTokens = async ({
  userId,
  deviceTokens,
}: RemoveDeviceTokensArgs): Promise<User | ApplicationError> => {
  const usersRepo = UsersRepository()
  const notificationsService = NotificationsService()

  const user = await usersRepo.findById(userId)
  if (user instanceof Error) return user

  for (const token of deviceTokens) {
    const res = await notificationsService.removePushDeviceToken({
      userId: user.id,
      deviceToken: token,
    })

    if (res instanceof Error) return res
  }

  return user
}
