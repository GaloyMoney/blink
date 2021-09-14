import { GT } from "@graphql/index"

import SuccessPayload from "@graphql/types/payload/success-payload"

const TwoFADeleteInput = new GT.Input({
  name: "TwoFADeleteInput",
  fields: () => ({
    token: {
      type: GT.NonNull(GT.String),
    },
  }),
})

const TwoFADeleteMutation = GT.Field({
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(TwoFADeleteInput) },
  },
  resolve: async (_, args, { wallet }) => {
    const { token } = args.input

    try {
      const success = await wallet.delete2fa({ token })
      return { errors: [], success }
    } catch (err) {
      return { errors: [{ message: err.message }] }
    }
  },
})

export default TwoFADeleteMutation
