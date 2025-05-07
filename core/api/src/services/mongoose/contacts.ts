import { parseRepositoryError } from "./utils"

import { Contact } from "@/services/mongoose/schema"
import {
  RepositoryError,
  CouldNotUpdateContactError,
  CouldNotFindContactFromAccountIdError,
} from "@/domain/errors"

export const ContactsRepository = (): IContactsRepository => {
  const findContact = async ({
    accountId,
    identifier,
  }: {
    accountId: AccountId
    identifier: string
  }): Promise<Contact | RepositoryError> => {
    try {
      const result = await Contact.findOne({ accountId, identifier })
      if (!result) {
        return new CouldNotFindContactFromAccountIdError(accountId)
      }

      return contactFromRaw(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const persistNew = async (
    contactInput: NewContactInput,
  ): Promise<Contact | RepositoryError> => {
    try {
      const contact = await new Contact({
        ...contactInput,
      }).save()

      return contactFromRaw(contact)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const update = async (contact: Contact): Promise<Contact | RepositoryError> => {
    try {
      const result = await Contact.findOneAndUpdate(
        { accountId: contact.accountId, id: contact.id },
        contactToRaw(contact),
        { new: true },
      )
      if (!result) return new CouldNotUpdateContactError()

      return contactFromRaw(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  return {
    findContact,
    persistNew,
    update,
  }
}

const contactFromRaw = (result: ContactRecord): Contact => ({
  id: result.id as ContactId,
  accountId: result.accountId as AccountId,
  identifier: result.identifier,
  type: result.type as ContactType,
  alias: result.alias ?? "",
  transactionsCount: result.transactionsCount,
  createdAt: result.createdAt,
})

const contactToRaw = (contact: Contact): ContactRecord => ({
  id: contact.id,
  accountId: contact.accountId,
  identifier: contact.identifier,
  type: contact.type,
  alias: contact.alias,
  transactionsCount: contact.transactionsCount,
  createdAt: contact.createdAt,
})
