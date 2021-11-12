import { UsersRepository } from "@services/mongoose"
import { ValidationError } from "@domain/errors"

export const updateContactAlias = async ({
  userId,
  username,
  alias,
}: {
  userId: UserId
  username: string
  alias: string
}): Promise<UserContact | ApplicationError> => {
  const repo = UsersRepository()
  const user = await repo.findById(userId)
  if (user instanceof Error) {
    return user
  }

  const contact = user.contacts.find((contact) => contact.username === username)
  if (!contact) {
    return new ValidationError(`User doesn't have contact ${username}`)
  }
  contact.alias = alias as ContactAlias

  const result = await repo.update(user)
  if (result instanceof Error) {
    return result
  }

  return contact
}
