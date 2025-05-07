import { upserContact } from "./upsert-contact"

import { ContactType } from "@/domain/contacts"

export const upsertIntraledgerContacts = async ({
  senderAccount,
  recipientAccount,
}: {
  senderAccount: Account
  recipientAccount: Account
}): Promise<true | ApplicationError> => {
  if (!(senderAccount.contactEnabled && recipientAccount.contactEnabled)) {
    return true
  }

  if (recipientAccount.username) {
    const contactToPayerResult = await upserContact({
      accountId: senderAccount.id,
      identifier: recipientAccount.username,
      alias: recipientAccount.username,
      type: ContactType.IntraLedger,
    })
    if (contactToPayerResult instanceof Error) return contactToPayerResult
  }

  if (senderAccount.username) {
    const contactToPayeeResult = await upserContact({
      accountId: recipientAccount.id,
      identifier: senderAccount.username,
      alias: senderAccount.username,
      type: ContactType.IntraLedger,
    })
    if (contactToPayeeResult instanceof Error) return contactToPayeeResult
  }

  return true
}
