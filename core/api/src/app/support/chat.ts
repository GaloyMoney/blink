import { ChatSupportNotFoundError } from "@/domain/chat-support/errors"
import { RepositoryError } from "@/domain/errors"
import { AccountsRepository, UsersRepository } from "@/services/mongoose"
import { SupportChatRepository } from "@/services/mongoose/support-chat"
import { Assistant } from "@/services/openai"

export const getSupportChatMessages = async (accountId: AccountId) => {
  const supportChatId = await SupportChatRepository().getLastFromAccountId(accountId)

  if (supportChatId instanceof ChatSupportNotFoundError) {
    return supportChatId
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

  let supportChatId = await SupportChatRepository().getLastFromAccountId(accountId)

  if (supportChatId instanceof ChatSupportNotFoundError) {
    const supportChatIdOrError = await Assistant().initialize()
    if (supportChatIdOrError instanceof Error) return supportChatIdOrError

    supportChatId = supportChatIdOrError

    const res = await SupportChatRepository().add({ supportChatId, accountId })
    if (res instanceof RepositoryError) return res
  }

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof RepositoryError) return account

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
