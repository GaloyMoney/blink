import { SupportChat } from "@/app"

import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import IError from "@/graphql/shared/types/abstract/error"
import SupportMessage from "@/graphql/public/types/object/support-message"

const SupportChatMessageAddInput = GT.Input({
  name: "SupportChatMessageAddInput",
  fields: () => ({
    message: { type: GT.NonNull(GT.String) },
  }),
})

const SupportChatMessageAddPayload = GT.Object({
  name: "SupportChatMessageAddPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    supportMessage: {
      type: GT.List(SupportMessage),
    },
  }),
})

const SupportChatMessageAdd = GT.Field<
  null,
  GraphQLPublicContextAuth,
  { input: { message: string } }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SupportChatMessageAddPayload),
  args: {
    input: { type: GT.NonNull(SupportChatMessageAddInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { message } = args.input

    const messages = await SupportChat.addSupportChatMessage({
      accountId: domainAccount.id,
      message,
    })

    if (messages instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(messages)] }
    }

    return {
      errors: [],
      supportMessage: messages,
    }
  },
})

export default SupportChatMessageAdd
