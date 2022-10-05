import { GT } from "@graphql/index"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import TwoFAGeneratePayload from "@graphql/types/payload/twofa-generate"
import { generate2fa } from "@app/users"

const TwoFAGenerateMutation = GT.Field<null, null, GraphQLContextForUser>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(TwoFAGeneratePayload),
  resolve: async (_, __, { domainUser }) => {
    const twoFASecret = await generate2fa(domainUser.id)
    if (twoFASecret instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(twoFASecret)] }
    }

    return { errors: [], twoFASecret }
  },
})

export default TwoFAGenerateMutation
