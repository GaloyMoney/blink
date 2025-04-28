type ContactType =
  (typeof import("./primitives").ContactType)[keyof typeof import("./primitives").ContactType]

type Contact = {
  accountId: AccountId
  contactId: string
  type: ContactType
  alias: string
  transactionsCount: number
  createdAt: Date
}

interface IContactsRepository {
  findByAccountId(
    accountId: AccountId,
    type?: ContactType,
  ): Promise<Contact[] | RepositoryError>

  findByContactId(
    contactId: string,
    type?: ContactType,
  ): Promise<Contact[] | RepositoryError>

  persistNew(contact: Contact): Promise<Contact | RepositoryError>

  update(contact: Contact): Promise<Contact | RepositoryError>
}
