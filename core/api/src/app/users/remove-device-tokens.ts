import { UsersRepository } from "@/services/mongoose"

export const removeDeviceTokens = async ({
  userId,
  deviceTokens,
}: RemoveDeviceTokensArgs): Promise<User | ApplicationError> => {
  const usersRepo = UsersRepository()

  const user = await usersRepo.findById(userId)
  if (user instanceof Error) return user

  const tokens = user.deviceTokens.filter((t) => !deviceTokens.includes(t))

  return usersRepo.update({ ...user, deviceTokens: tokens })
}
