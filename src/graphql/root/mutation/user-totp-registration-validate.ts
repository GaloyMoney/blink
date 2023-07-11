import { GT } from "@graphql/index"

import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import AuthToken from "@graphql/types/scalar/auth-token"
import TotpCode from "@graphql/types/scalar/totp-code"
import TotpRegistrationId from "@graphql/types/scalar/totp-verify-id"
import UserTotpRegistrationValidatePayload from "@graphql/types/payload/user-totp-registration-validate"

const UserTotpRegistrationValidateInput = GT.Input({
  name: "UserTotpRegistrationValidateInput",
  fields: () => ({
    authToken: {
      type: GT.NonNull(AuthToken),
    },
    totpCode: {
      type: GT.NonNull(TotpCode),
    },
    totpRegistrationId: {
      type: GT.NonNull(TotpRegistrationId),
    },
  }),
})

const UserTotpRegistrationValidateMutation = GT.Field<
  {
    input: {
      authToken: SessionToken | InputValidationError
      totpCode: TotpCode | InputValidationError
      totpRegistrationId: TotpRegistrationId | InputValidationError
    }
  },
  null,
  GraphQLContextAuth
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserTotpRegistrationValidatePayload),
  args: {
    input: { type: GT.NonNull(UserTotpRegistrationValidateInput) },
  },
  resolve: async (_, args, { user }) => {
    const { authToken, totpCode, totpRegistrationId } = args.input

    if (authToken instanceof Error) {
      return { errors: [{ message: authToken.message }] }
    }
    if (totpCode instanceof Error) {
      return { errors: [{ message: totpCode.message }] }
    }
    if (totpRegistrationId instanceof Error) {
      return { errors: [{ message: totpRegistrationId.message }] }
    }

    const me = await Auth.validateTotpRegistration({
      authToken,
      totpCode,
      totpRegistrationId,
      userId: user.id,
    })

    if (me instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(me)], success: false }
    }

    return { errors: [], me }
  },
})

export default UserTotpRegistrationValidateMutation
