type SupportChatId = string & { readonly brand: unique symbol }

type Message = {
  id: string
  message: string
  role: "user" | "assistant"
  timestamp: number
}
