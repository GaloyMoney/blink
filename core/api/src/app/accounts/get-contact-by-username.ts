import { NoContactForUsernameError } from "@domain/errors"

export const getContactByUsername = async ({
  account,
  contactUsername,
}: {
  account: Account
  contactUsername: string
}): Promise<AccountContact | ApplicationError> => {
  const contact = account.contacts.find(
    (contact) => contact.username.toLocaleLowerCase() === contactUsername,
  )
  if (!contact) {
    return new NoContactForUsernameError()
  }
  return contact
}
