import { NoContactForUsernameError } from "@domain/errors"

export const getContactByUsername = async ({
  user,
  contactUsername,
}: {
  user: User
  contactUsername: string
}): Promise<UserContact | ApplicationError> => {
  const contact = user.contacts.find(
    (contact) => contact.username.toLocaleLowerCase() === contactUsername,
  )
  if (!contact) {
    return new NoContactForUsernameError()
  }
  return contact
}
