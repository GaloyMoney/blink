import { GT } from "@graphql/index"

import SuccessPayload from "@graphql/types/payload/success-payload"

const DeviceNotificatinoTokenCreateInput = new GT.Input({
  name: "DeviceNotificatinoTokenCreateInput",
  fields: () => ({
    deviceToken: { type: GT.NonNull(GT.String) },
  }),
})

const DeviceNotificatinoTokenCreateMutation = GT.Field({
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(DeviceNotificatinoTokenCreateInput) },
  },
  resolve: async (_, args, { user }) => {
    const { deviceToken } = args.input

    try {
      user.deviceToken.addToSet(deviceToken)
      await user.save()
    } catch (err) {
      return { errors: [{ message: err.message }] }
    }

    return { errors: [], success: true }
  },
})

export default DeviceNotificatinoTokenCreateMutation
