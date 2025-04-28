import { parseRepositoryError } from "./utils"

import { Contact } from "@/services/mongoose/schema"
import {
  RepositoryError,
  CouldNotUpdateContactError,
  CouldNotFindContactFromAccountIdError,
  CouldNotFindContactFromContactIdError,
} from "@/domain/errors"

export const ContactsRepository = (): IContactsRepository => {
  const findByAccountId = async (
    accountId: AccountId,
    type?: ContactType,
  ): Promise<Contact[] | RepositoryError> => {
    try {
      const query: Record<string, unknown> = { accountId }
      if (type) query.type = type

      const results = await Contact.find(query)
      if (!results.length) {
        return new CouldNotFindContactFromAccountIdError(accountId)
      }

      return results.map(contactFromRaw)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findByContactId = async (
    contactId: string,
    type?: ContactType,
  ): Promise<Contact[] | RepositoryError> => {
    try {
      const query: Record<string, unknown> = { contactId }
      if (type) query.type = type

      const results = await Contact.find(query)
      if (!results.length) {
        return new CouldNotFindContactFromContactIdError(contactId)
      }

      return results.map(contactFromRaw)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const persistNew = async (contact: Contact): Promise<Contact | RepositoryError> => {
    try {
      const created = await new Contact(contactToRaw(contact)).save()
      return contactFromRaw(created)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const update = async (contact: Contact): Promise<Contact | RepositoryError> => {
    try {
      const result = await Contact.findOneAndUpdate(
        { accountId: contact.accountId, contactId: contact.contactId },
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
    findByAccountId,
    findByContactId,
    persistNew,
    update,
  }
}

const contactFromRaw = (result: ContactRecord): Contact => ({
  accountId: result.accountId as AccountId,
  contactId: result.contactId,
  type: result.type as ContactType,
  alias: result.alias ?? "",
  transactionsCount: result.transactionsCount,
  createdAt: result.createdAt,
})

const contactToRaw = (contact: Contact): ContactRecord => ({
  accountId: contact.accountId,
  contactId: contact.contactId,
  type: contact.type,
  alias: contact.alias,
  transactionsCount: contact.transactionsCount,
  createdAt: contact.createdAt,
})
