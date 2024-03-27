type ChatSupportError = import("../../domain/chat-support/errors").ChatSupportError

interface Assistant {
  getMessages: (supportChatId: SupportChatId) => Promise<Message[] | ChatSupportError>
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
  }) => Promise<true | ChatSupportError>
  initialize: () => Promise<SupportChatId | ChatSupportError>
}
