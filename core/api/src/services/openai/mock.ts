const messages = [] as Message[]

export const AssistantMock = (): ChatAssistant => {
  const initialize = async () => {
    messages.length = 0

    messages.push({
      id: "1",
      role: "user",
      message: "Hi",
      timestamp: Date.now() - 10000,
    })
    messages.push({
      id: "2",
      role: "assistant",
      message: "Hi, how can I help?",
      timestamp: Date.now(),
    })

    // return a random value
    return (Math.random() * 10000000 + "") as SupportChatId
  }

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
