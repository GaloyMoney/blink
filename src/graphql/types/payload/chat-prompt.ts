import { GT } from "@graphql/index"

import IError from "../abstract/error"
import Answer from "../scalar/chat-answer"

const ChatPromptPayload = GT.Object({
  name: "ChatPromptPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    answer: {
      type: Answer,
    },
  }),
})

export default ChatPromptPayload
