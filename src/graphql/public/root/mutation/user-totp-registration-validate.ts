import { GT } from "@graphql/index"

import { Authentication } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import AuthToken from "@graphql/shared/types/scalar/auth-token"
import TotpCode from "@graphql/public/types/scalar/totp-code"
import TotpRegistrationId from "@graphql/public/types/scalar/totp-verify-id"
import UserTotpRegistrationValidatePayload from "@graphql/public/types/payload/user-totp-registration-validate"

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
      authToken: AuthToken | InputValidationError
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

    const me = await Authentication.validateTotpRegistration({
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
