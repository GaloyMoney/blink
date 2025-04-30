import { CouldNotFindContactFromAccountIdError } from "@/domain/errors"
import { ContactsRepository } from "@/services/mongoose"

export const upserContact = async ({
  accountId,
  identifier,
  alias,
  type,
}: {
  accountId: AccountId
  identifier: string
  type: ContactType
  alias: string
}): Promise<Contact | ApplicationError> => {
  const contactsRepo = ContactsRepository()

  const existing = await contactsRepo.findContact({ accountId, identifier })
  if (existing instanceof CouldNotFindContactFromAccountIdError) {
    return contactsRepo.persistNew({
      accountId,
      identifier,
      type,
      alias,
      transactionsCount: 1,
    })
  }

  if (existing instanceof Error) return existing

  return contactsRepo.update({
    ...existing,
    alias,
    transactionsCount: existing.transactionsCount + 1,
  })
}
