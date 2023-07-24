import { GT } from "@graphql/index"

import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import AuthToken from "@graphql/types/scalar/auth-token"
import UserTotpRegistrationInitiatePayload from "@graphql/types/payload/user-totp-registration-initiate"

const UserTotpRegistrationInitiateInput = GT.Input({
  name: "UserTotpRegistrationInitiateInput",
  fields: () => ({
    authToken: {
      type: GT.NonNull(AuthToken),
    },
  }),
})

const UserTotpRegistrationInitiateMutation = GT.Field<
  {
    input: {
      authToken: AuthToken | InputValidationError
    }
  },
  null,
  GraphQLContextAuth
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserTotpRegistrationInitiatePayload),
  args: {
    input: { type: GT.NonNull(UserTotpRegistrationInitiateInput) },
  },
  resolve: async (_, args) => {
    const { authToken } = args.input

    if (authToken instanceof Error) {
      return { errors: [{ message: authToken.message }] }
    }

    const res = await Auth.initiateTotpRegistration({
      authToken,
    })

    if (res instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(res)], success: false }
    }

    const { totpSecret, totpRegistrationId } = res

    return { errors: [], totpRegistrationId, totpSecret }
  },
})

export default UserTotpRegistrationInitiateMutation
