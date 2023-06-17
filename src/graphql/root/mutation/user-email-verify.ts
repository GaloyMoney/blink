import { GT } from "@graphql/index"

import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import Flow from "@graphql/types/scalar/flow"
import OneTimeAuthCode from "@graphql/types/scalar/one-time-auth-code"
import UserEmailVerifyPayload from "@graphql/types/payload/user-email-verify"

const UserEmailVerifyInput = GT.Input({
  name: "UserEmailVerifyInput",
  fields: () => ({
    flow: {
      type: GT.NonNull(Flow),
    },
    code: {
      type: GT.NonNull(OneTimeAuthCode),
    },
  }),
})

const UserEmailVerifyMutation = GT.Field<
  {
    input: {
      flow: FlowId | InputValidationError
      code: EmailCode | InputValidationError
    }
  },
  null,
  GraphQLContextAuth
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserEmailVerifyPayload),
  args: {
    input: { type: GT.NonNull(UserEmailVerifyInput) },
  },
  resolve: async (_, args) => {
    const { flow, code } = args.input

    if (flow instanceof Error) {
      return { errors: [{ message: flow.message }] }
    }

    if (code instanceof Error) {
      return { errors: [{ message: code.message }] }
    }

    // FIXME: should the user be the only that can verify the email?
    // not sure what attack vector it could limit, but I guess
    // this is probably a safe assumption we should add it nonetheless
    const me = await Auth.verifyEmail({
      flowId: flow,
      code,
    })

    if (me instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(me)] }
    }

    return { errors: [], me }
  },
})

export default UserEmailVerifyMutation
