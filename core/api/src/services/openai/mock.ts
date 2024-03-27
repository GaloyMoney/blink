export const AssistantMock = (): ChatAssistant => {
  const initialize = async () => {
    // return random ID
    return "123" as SupportChatId
  }

  const messages = [] as Message[]

  const addUserMessage = async (): Promise<true | Error> => {
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
    return true
  }

  const getMessages = async () => {
    return messages as Message[]
  }

  return {
    initialize,
    addUserMessage,
    getMessages,
  }
}
