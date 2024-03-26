import { RepositoryError } from "@/domain/errors"
import { AccountsRepository, UsersRepository } from "@/services/mongoose"
import { Assistant } from "@/services/openai"

export const getSupportChatMessages = async (accountId: AccountId) => {
  const account = await AccountsRepository().findById(accountId)

  if (account instanceof RepositoryError) {
    return account
  }

  // account.supportChatId should be an array
  const supportChatId = account.supportChatId

  if (!supportChatId) {
    return []
  }

  return Assistant().getMessages(supportChatId)
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

  let supportChatId = account.supportChatId

  if (!supportChatId) {
    const supportChatIdOrError = await Assistant().initialize()
    if (supportChatIdOrError instanceof Error) return supportChatIdOrError

    supportChatId = supportChatIdOrError
    const updateThread = await AccountsRepository().update({ ...account, supportChatId })
    if (updateThread instanceof RepositoryError) return updateThread
  }

  const user = await UsersRepository().findById(account.kratosUserId)
  if (user instanceof RepositoryError) return user

  const countryCode = user.phoneMetadata?.countryCode ?? "unknown"
  const level = account.level
  const language = "en" // FIXME: get language from user

  const result = await Assistant().addUserMessage({
    message,
    supportChatId,
    level,
    countryCode,
    language,
  })
  if (result instanceof Error) return result

  return Assistant().getMessages(supportChatId)
}
