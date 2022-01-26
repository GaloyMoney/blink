import { save2fa } from "@app/users"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"

import SuccessPayload from "@graphql/types/payload/success-payload"

const TwoFASaveInput = GT.Input({
  name: "TwoFASaveInput",
  fields: () => ({
    secret: {
      type: GT.NonNull(GT.String),
    },
    token: {
      type: GT.NonNull(GT.String),
    },
  }),
})

const TwoFASaveMutation = GT.Field<
  { input: { secret: string; token: string } },
  null,
  GraphQLContextForUser
>({
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(TwoFASaveInput) },
  },
  resolve: async (_, args, { domainUser }) => {
    const { secret, token } = args.input

    const user = await save2fa({
      // FIXME: check token and secret before casting
      secret: secret as TwoFASecret,
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

export default TwoFASaveMutation
