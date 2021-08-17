import { UsersRepository } from "@services/mongoose"

export const getUser = async (userId: UserId) => {
  const repo = UsersRepository()
  return repo.findById(userId)
}
