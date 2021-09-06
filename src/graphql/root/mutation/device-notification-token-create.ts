import { GT } from "@graphql/index"

import SuccessPayload from "@graphql/types/payload/success-payload"

const DeviceNotificationTokenCreateInput = new GT.Input({
  name: "DeviceNotificationTokenCreateInput",
  fields: () => ({
    deviceToken: { type: GT.NonNull(GT.String) },
  }),
})

const DeviceNotificationTokenCreateMutation = GT.Field({
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(DeviceNotificationTokenCreateInput) },
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

export default DeviceNotificationTokenCreateMutation
