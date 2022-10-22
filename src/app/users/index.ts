import { UsersRepository } from "@services/mongoose"

export * from "./get-user"
export * from "./login"
export * from "./request-phone-code"
export * from "./update-language"

const users = UsersRepository()

export const getUser = async (userId: UserId) => {
  return users.findById(userId)
}
