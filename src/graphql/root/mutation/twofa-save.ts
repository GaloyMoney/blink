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
  resolve: async (_, args, { wallet }) => {
    const { secret, token } = args.input

    for (const input of [secret, token]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    try {
      const success = await wallet.save2fa({ secret, token })
      return { errors: [], success }
    } catch (err) {
      return { errors: [{ message: err.message }] }
    }
  },
})

export default TwoFASaveMutation
