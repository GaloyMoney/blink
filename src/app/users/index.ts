import { UsersRepository } from "@services/mongoose"

export * from "./add-new-contact"
export * from "./get-contact-by-username"
export * from "./get-user"
export * from "./login"
export * from "./request-phone-code"
export * from "./update-contact-alias"

const users = UsersRepository()

export const getUser = async (userId: UserId) => {
  return users.findById(userId)
}
