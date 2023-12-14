import { UsersRepository } from "@/services/mongoose"

export * from "./update-language"
export * from "./add-device-token"

const users = UsersRepository()

export const getUser = async (userId: UserId): Promise<User | RepositoryError> => {
  return users.findById(userId)
}
