import { GT } from "@graphql/index"

import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import EmailAddress from "@graphql/types/scalar/email-address"
import UserEmailSetPayload from "@graphql/types/payload/user-email-set"

const UserEmailSetInput = GT.Input({
  name: "UserEmailSetInput",
  fields: () => ({
    email: {
      type: GT.NonNull(EmailAddress),
    },
  }),
})

const UserEmailSetMutation = GT.Field<
  {
    input: {
      email: EmailAddress | InputValidationError
    }
  },
  null,
  GraphQLContextAuth
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserEmailSetPayload),
  args: {
    input: { type: GT.NonNull(UserEmailSetInput) },
  },
  resolve: async (_, args, { user }) => {
    const { email } = args.input

    if (email instanceof Error) {
      return { errors: [{ message: email.message }] }
    }

    const res = await Auth.addEmailToIdentity({
      email,
      userId: user.id,
    })

    if (res instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(res)], success: false }
    }

    const { flow, me } = res

    return { errors: [], flow, me }
  },
})

export default UserEmailSetMutation
