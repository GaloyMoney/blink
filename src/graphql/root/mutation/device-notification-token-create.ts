import { GT } from "@graphql/index"

import SuccessPayload from "@graphql/types/payload/success-payload"

const DeviceNotificationTokenCreateInput = GT.Input({
  name: "DeviceNotificationTokenCreateInput",
  fields: () => ({
    deviceToken: { type: GT.NonNull(GT.String) },
  }),
})

const DeviceNotificationTokenCreateMutation = GT.Field<
  { input: { deviceToken: string } },
  null,
  GraphQLContextForUser
>({
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(DeviceNotificationTokenCreateInput) },
  },
  resolve: async (_, args, { user }) => {
    const { deviceToken } = args.input

    try {
      // FIXME: this should be moved to a use case
      // deviceToken is casted as a string[], and doesn't have addToSet function
      // (but this exist from mongoose)
      // @ts-expect-error: FIXME.
      user.deviceToken.addToSet(deviceToken)
      await user.save()
    } catch (err) {
      return { errors: [{ message: err.message }] }
    }

    return { errors: [], success: true }
  },
})

export default DeviceNotificationTokenCreateMutation
