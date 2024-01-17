import { RepositoryError } from "@/domain/errors"
import { AccountsRepository, UsersRepository } from "@/services/mongoose"
import { Assistant } from "@/services/openai"

export const getSupportChatMessages = async (accountId: AccountId) => {
  const account = await AccountsRepository().findById(accountId)

  if (account instanceof RepositoryError) {
    return account
  }

  // account.threadId should be an array
  const threadId = account.threadId

  if (!threadId) {
    return []
  }

  return Assistant().getMessages(threadId)
}

export const addSupportChatMessage = async ({
  message,
  accountId,
}: {
  message: string
  accountId: AccountId
}) => {
  // TODO: rate limits

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof RepositoryError) return account

  let threadId = account.threadId

  if (!threadId) {
    const threadIdOrError = await Assistant().initialize()

    if (threadIdOrError instanceof Error) {
      return threadIdOrError
    } else {
      threadId = threadIdOrError
      const updateThread = await AccountsRepository().update({ ...account, threadId })
      if (updateThread instanceof RepositoryError) return updateThread
    }
  }

  const user = await UsersRepository().findById(account.kratosUserId)
  if (user instanceof RepositoryError) return user

  const countryCode = user.phoneMetadata?.countryCode ?? "unknown"
  const level = account.level
  const language = "en" // FIXME: get language from user

  const result = await Assistant().addUserMessage({
    message,
    threadId,
    level,
    countryCode,
    language,
  })
  if (result instanceof Error) return result

  return Assistant().getMessages(threadId)
}
