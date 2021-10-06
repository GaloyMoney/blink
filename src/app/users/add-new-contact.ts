import { CouldNotFindError, NoUserForUsernameError } from "@domain/errors"
import { UsersRepository } from "@services/mongoose"

export const addNewContact = async ({
  userId,
  contactUsername,
}: {
  userId: UserId
  contactUsername: Username
}): Promise<User | ApplicationError> => {
  const usersRepo = UsersRepository()

  const contactUser = await usersRepo.findByUsername(contactUsername)
  if (contactUser instanceof CouldNotFindError)
    return new NoUserForUsernameError(contactUsername)
  if (contactUser instanceof Error) return contactUser

  const user = await usersRepo.findById(userId)
  if (user instanceof Error) return user

  const found = user.contacts.find(
    (userContact) => userContact.username === contactUsername,
  )
  if (found) return user

  user.contacts.push({
    username: contactUsername,
    alias: "" as ContactAlias,
    transactionsCount: 1,
  })
  const updateResult = await usersRepo.update(user)
  if (updateResult instanceof Error) return updateResult

  return user
}
