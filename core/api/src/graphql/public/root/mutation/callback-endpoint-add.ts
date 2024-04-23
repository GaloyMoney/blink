import { Callback } from "@/app"

import { GT } from "@/graphql/index"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import EndpointUrl from "@/graphql/public/types/scalar/endpoint-url"
import CallbackEndpointAddPayload from "@/graphql/public/types/payload/callback-endpoint-add"

const CallbackEndpointAddInput = GT.Input({
  name: "CallbackEndpointAddInput",
  fields: () => ({
    url: { type: GT.NonNull(EndpointUrl), description: "callback endpoint to be called" },
  }),
})

const CallbackEndpointAddMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  { input: { url: string | Error } }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(CallbackEndpointAddPayload),
  args: {
    input: { type: GT.NonNull(CallbackEndpointAddInput) },
  },
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const { url } = args.input
    if (url instanceof Error) {
      return { errors: [{ message: url.message }] }
    }

    const result = await Callback.addEndpoint({
      accountId: domainAccount.id,
      url,
    })

    if (result instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(result)], success: false }
    }

    return {
      errors: [],
      id: result.id,
    }
  },
})

export default CallbackEndpointAddMutation
