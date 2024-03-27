export const AssistantMock = (): Assistant => {
  const initialize = async () => {
    // return random ID
    return "123" as SupportChatId
  }

  let messages = [] as Message[]

  const addUserMessage = async ({
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
  }): Promise<true | Error> => {
    return true
  }

  const getMessages = async (supportChatId: string) => {
    messages.push({
      id: "1",
      role: "user",
      message: "Hello",
      timestamp: Date.now() - 10000,
    })
    messages.push({
      id: "2",
      role: "assistant",
      message: "Hi, how can I help?",
      timestamp: Date.now(),
    })
    return messages as Message[]
  }

  return {
    initialize,
    addUserMessage,
    getMessages,
  }
}
