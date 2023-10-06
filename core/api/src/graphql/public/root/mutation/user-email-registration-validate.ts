import { GT } from "@/graphql/index"

import { Authentication } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import EmailRegistrationId from "@/graphql/public/types/scalar/email-verify-id"
import OneTimeAuthCode from "@/graphql/shared/types/scalar/one-time-auth-code"
import UserEmailRegistrationValidatePayload from "@/graphql/public/types/payload/user-email-registration-validate"

const UserEmailRegistrationValidateInput = GT.Input({
  name: "UserEmailRegistrationValidateInput",
  fields: () => ({
    emailRegistrationId: {
      type: GT.NonNull(EmailRegistrationId),
    },
    code: {
      type: GT.NonNull(OneTimeAuthCode),
    },
  }),
})

const UserEmailRegistrationValidateMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      emailRegistrationId: EmailRegistrationId | InputValidationError
      code: EmailCode | InputValidationError
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserEmailRegistrationValidatePayload),
  args: {
    input: { type: GT.NonNull(UserEmailRegistrationValidateInput) },
  },
  resolve: async (_, args) => {
    const { emailRegistrationId, code } = args.input

    if (emailRegistrationId instanceof Error) {
      return { errors: [{ message: emailRegistrationId.message }] }
    }

    if (code instanceof Error) {
      return { errors: [{ message: code.message }] }
    }

    // FIXME: should the user be the only that can verify the email?
    // not sure what attack vector it could limit, but I guess
    // this is probably a safe assumption we should add it nonetheless
    const me = await Authentication.verifyEmail({
      emailRegistrationId,
      code,
    })

    if (me instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(me)] }
    }

    return { errors: [], me }
  },
})

export default UserEmailRegistrationValidateMutation
