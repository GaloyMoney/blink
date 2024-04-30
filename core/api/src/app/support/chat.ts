import { Users } from "@/app"
import { RepositoryError, CouldNotFindError } from "@/domain/errors"
import { ChatAssistantNotFoundError } from "@/domain/support/errors"
import { AccountsRepository, UsersRepository } from "@/services/mongoose"
import { SupportChatRepository } from "@/services/mongoose/support-chat"
import { NotificationsService } from "@/services/notifications"
import { Assistant } from "@/services/openai"

const getMessages = async ({
  supportChatId,
  accountId,
}: {
  supportChatId: SupportChatId
  accountId: AccountId
}) => {
  const messages = Assistant().getMessages(supportChatId)
  if (messages instanceof ChatAssistantNotFoundError) {
    await initializeSupportChat({ accountId })
    return []
  }

  return messages
}

export const initializeSupportChat = async ({
  accountId,
}: {
  accountId: AccountId
}): Promise<SupportChatId | ApplicationError> => {
  const account = await AccountsRepository().findById(accountId)
  if (account instanceof RepositoryError) return account

  const user = await UsersRepository().findById(account.kratosUserId)
  if (user instanceof RepositoryError) return user

  const countryCode = user.phoneMetadata?.countryCode ?? "unknown"
  const level = account.level
  const setting = await NotificationsService().getUserNotificationSettings(user.id)
  if (setting instanceof Error) return setting
  const language = setting.language ?? "en"

  const supportChatId = await Assistant().initialize({
    level,
    countryCode,
    language,
  })
  if (supportChatId instanceof Error) return supportChatId

  const res = await SupportChatRepository().create({ supportChatId, accountId })
  if (res instanceof RepositoryError) return res

  return supportChatId
}

export const getSupportChatMessages = async (accountId: AccountId) => {
  const supportChatId = await SupportChatRepository().findNewestByAccountId(accountId)

  if (supportChatId instanceof CouldNotFindError) {
    return []
  } else if (supportChatId instanceof Error) {
    return supportChatId
  }

  return getMessages({
    supportChatId,
    accountId,
  })
}

export const addSupportChatMessage = async ({
  message,
  accountId,
}: {
  message: string
  accountId: AccountId
}) => {
  // TODO: rate limits

  let supportChatId = await SupportChatRepository().findNewestByAccountId(accountId)

  if (supportChatId instanceof CouldNotFindError) {
    supportChatId = await initializeSupportChat({ accountId })
    if (supportChatId instanceof Error) return supportChatId
  } else if (supportChatId instanceof Error) {
    return supportChatId
  }

  const result = await Assistant().addUserMessage({
    message,
    supportChatId,
  })
  if (result instanceof Error) return result

  return getMessages({
    supportChatId,
    accountId,
  })
}
