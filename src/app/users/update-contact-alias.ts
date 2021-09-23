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
}): Promise<User | ApplicationError> => {
  const repo = UsersRepository()
  const user = await repo.findById(userId)
  if (user instanceof Error) {
    return user
  }

  const found = user.contacts.find((contact) => contact.username === username)
  if (!found) {
    return new ValidationError(`User doesn't have contact ${username}`)
  }
  found.alias = alias as ContactAlias

  const result = await repo.update(user)
  if (result instanceof Error) {
    return result
  }

  return user
}
