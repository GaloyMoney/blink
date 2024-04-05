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
    level,
    countryCode,
    language,
  }: {
    message: string
    supportChatId: SupportChatId
    level: number
    countryCode: string
    language: string
  }) => Promise<true | ChatAssistantError>
  initialize: () => Promise<SupportChatId | ChatAssistantError>
}

interface ISupportChatRepository {
  findNewestByAccountId: (
    accountId: AccountId,
  ) => Promise<SupportChatId | RepositoryError>
  add: (args: {
    supportChatId: SupportChatId
    accountId: AccountId
  }) => Promise<true | RepositoryError>
}
