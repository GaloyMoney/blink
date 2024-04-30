import { SupportChat } from "@/app"

import { GT } from "@/graphql/index"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import SuccessPayload from "@/graphql/shared/types/payload/success-payload"

const SupportChatResetMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  { input: { id: string } }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const result = await SupportChat.initializeSupportChat({
      accountId: domainAccount.id,
    })

    if (result instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(result)], success: false }
    }

    return {
      errors: [],
      success: Boolean(result),
    }
  },
})

export default SupportChatResetMutation
