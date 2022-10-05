import { delete2fa } from "@app/users"
import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"

import SuccessPayload from "@graphql/types/payload/success-payload"

const TwoFADeleteInput = GT.Input({
  name: "TwoFADeleteInput",
  fields: () => ({
    token: {
      type: GT.NonNull(GT.String),
    },
  }),
})

const TwoFADeleteMutation = GT.Field<
  { input: { token: string } },
  null,
  GraphQLContextForUser
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(TwoFADeleteInput) },
  },
  resolve: async (_, args, { domainUser }) => {
    const { token } = args.input

    const user = await delete2fa({
      // FIXME: check token before casting
      token: token as TwoFAToken,
      userId: domainUser.id,
    })
    if (user instanceof Error) {
      const appErr = mapError(user)
      return { errors: [{ message: appErr.message }] }
    }

    return { errors: [], success: true }
  },
})

export default TwoFADeleteMutation
