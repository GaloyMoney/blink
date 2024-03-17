import { RepositoryError } from "@/domain/errors"
import { AccountsRepository } from "@/services/mongoose"
import { Assistant } from "@/services/openai"

export const Conversation = (accountId: AccountId) => {
  const getMessages = async () => {
    const account = await AccountsRepository().findById(accountId)

    if (account instanceof RepositoryError) {
      return account
    }

    const threadId = account.threadId

    if (!threadId) {
      return []
    }

    return Assistant().getMessages(threadId)
  }

  const addMessage = async (message: string) => {
    const account = await AccountsRepository().findById(accountId)

    if (account instanceof RepositoryError) {
      return account
    }

    let threadId = account.threadId

    if (!threadId) {
      threadId = await Assistant().createThread()
    }

    const country = "El Salvador"
    const level = 1

    const additionalInstructions = `This user has a phone number from ${country} and is at level ${level}.`

    return Assistant().addUserMessage({ message, threadId, additionalInstructions })
  }

  return { getMessages, addMessage }
}
