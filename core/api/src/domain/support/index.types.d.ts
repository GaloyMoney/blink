type ChatAssistantError = import("./errors").ChatAssistantError

type SupportRole =
  (typeof import("./index").SupportRole)[keyof typeof import("./index").SupportRole]

type SupportChatId = string & { readonly brand: unique symbol }

type Message = {
  id: string
  message: string
  role: SupportRole
  timestamp: number
}

interface ChatAssistant {
  getMessages: (supportChatId: SupportChatId) => Promise<Message[] | ChatAssistantError>
  addUserMessage: ({
    message,
    supportChatId,
  }: {
    message: string
    supportChatId: SupportChatId
  }) => Promise<true | ChatAssistantError>
  initialize: ({
    level,
    countryCode,
    language,
  }: {
    level: number
    countryCode: string
    language: string
  }) => Promise<SupportChatId | ChatAssistantError>
}

interface ISupportChatRepository {
  findNewestByAccountId: (
    accountId: AccountId,
  ) => Promise<SupportChatId | RepositoryError>
  create: (args: {
    supportChatId: SupportChatId
    accountId: AccountId
  }) => Promise<true | RepositoryError>
}
