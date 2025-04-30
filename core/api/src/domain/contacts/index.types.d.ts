type ContactType =
  (typeof import("./primitives").ContactType)[keyof typeof import("./primitives").ContactType]

type Contact = {
  readonly id: ContactId
  readonly createdAt: Date
  accountId: AccountId
  type: ContactType
  identifier: string
  alias: string
  transactionsCount: number
}

type NewContactInput = Omit<Contact, "id" | "createdAt">

interface IContactsRepository {
  findContact({
    accountId,
    identifier,
  }: {
    accountId: AccountId
    identifier?: string
  }): Promise<Contact | RepositoryError>

  persistNew(contact: NewContactInput): Promise<Contact | RepositoryError>

  update(contact: Contact): Promise<Contact | RepositoryError>
}
