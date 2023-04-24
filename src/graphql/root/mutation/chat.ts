import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { GT } from "@graphql/index"
import ChatPromptPayload from "@graphql/types/payload/chat-prompt"

import Prompt from "@graphql/types/scalar/chat-prompt"

const ChatInput = GT.Input({
  name: "ChatInput",
  fields: () => ({
    prompt: { type: GT.NonNull(Prompt) },
  }),
})

const ChatPromptMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(ChatPromptPayload),
  args: {
    input: { type: GT.NonNull(ChatInput) },
  },
  resolve: async (_, args, { domainAccount }: GraphQLContextAuth) => {
    const { prompt } = args.input

    if (prompt instanceof Error) {
      return { errors: [{ message: prompt.message }] }
    }

    const result = await Chat.getAnswer({ prompt, accountId: domainAccount.id })

    if (result instanceof Error) {
      return {
        errors: [mapAndParseErrorForGqlResponse(result)],
      }
    }

    return {
      errors: [],
      answer: result,
    }
  },
})

export default ChatPromptMutation
