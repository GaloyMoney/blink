import { save2fa } from "@app/users"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"

import SuccessPayload from "@graphql/types/payload/success-payload"

const TwoFASaveInput = new GT.Input({
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

const TwoFASaveMutation = GT.Field({
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(TwoFASaveInput) },
  },
  resolve: async (_, args, { domainUser }) => {
    const { secret, token } = args.input

    for (const input of [secret, token]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const user = await save2fa({ secret, token, userId: domainUser.id })
    if (user instanceof Error) {
      const appErr = mapError(user)
      return { errors: [{ message: appErr.message }] }
    }

    return { errors: [], success: true }
  },
})

export default TwoFASaveMutation
