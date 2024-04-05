import { AccountsRepository } from "@/services/mongoose"

const addNewContact = async ({
  accountId,
  contactUsername,
}: {
  accountId: AccountId
  contactUsername: Username
}): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()

  const contactAccount = await accountsRepo.findByUsername(contactUsername)
  if (contactAccount instanceof Error) return contactAccount

  const account = await accountsRepo.findById(accountId)
  if (account instanceof Error) return account

  const idx = account.contacts.findIndex(
    (userContact) => userContact.username === contactUsername,
  )
  if (idx >= 0) {
    account.contacts[idx].transactionsCount++
  } else {
    account.contacts.push({
      id: contactUsername,
      username: contactUsername,
      alias: "" as ContactAlias,
      transactionsCount: 1,
    })
  }
  const updateResult = await accountsRepo.update(account)
  if (updateResult instanceof Error) return updateResult

  return account
}

export const addContactsAfterSend = async ({
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
    const addContactToPayerResult = await addNewContact({
      accountId: senderAccount.id,
      contactUsername: recipientAccount.username,
    })
    if (addContactToPayerResult instanceof Error) return addContactToPayerResult
  }

  if (senderAccount.username) {
    const addContactToPayeeResult = await addNewContact({
      accountId: recipientAccount.id,
      contactUsername: senderAccount.username,
    })
    if (addContactToPayeeResult instanceof Error) return addContactToPayeeResult
  }

  return true
}
