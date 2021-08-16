import { MakeUsersRepository } from "@services/mongoose"

export const getUser = async (userId: UserId) => {
  const repo = MakeUsersRepository()
  return repo.findById(userId)
}
