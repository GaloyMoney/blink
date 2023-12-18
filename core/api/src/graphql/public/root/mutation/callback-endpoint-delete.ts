import { Callback } from "@/app"

import { GT } from "@/graphql/index"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import EndpointId from "@/graphql/public/types/scalar/endpoint-id"
import SuccessPayload from "@/graphql/shared/types/payload/success-payload"

const CallbackEndpointDeleteInput = GT.Input({
  name: "CallbackEndpointDeleteInput",
  fields: () => ({
    id: { type: GT.NonNull(EndpointId) },
  }),
})

const CallbackEndpointDelete = GT.Field<
  null,
  GraphQLPublicContextAuth,
  { input: { id: string } }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(CallbackEndpointDeleteInput) },
  },
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const { id } = args.input

    const result = await Callback.deleteEndpoint({
      accountId: domainAccount.id,
      id,
    })

    if (result instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(result)], success: false }
    }

    return {
      errors: [],
      success: result,
    }
  },
})

export default CallbackEndpointDelete
