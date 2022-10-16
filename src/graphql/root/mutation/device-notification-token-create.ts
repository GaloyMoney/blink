import { GT } from "@graphql/index"

import SuccessPayload from "@graphql/types/payload/success-payload"

import { Users } from "@app"

const DeviceNotificationTokenCreateInput = GT.Input({
  name: "DeviceNotificationTokenCreateInput",
  fields: () => ({
    deviceToken: { type: GT.NonNull(GT.String) },
  }),
})

const DeviceNotificationTokenCreateMutation = GT.Field<
  { input: { deviceToken: string } },
  null,
  GraphQLContextAuth
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(DeviceNotificationTokenCreateInput) },
  },
  resolve: async (_, args, { kratosUser }) => {
    const { deviceToken } = args.input

    try {
      await Users.addDeviceToken({ kratosUserId: kratosUser.id, deviceToken })
    } catch (err) {
      return { errors: [{ message: err.message }] }
    }

    return { errors: [], success: true }
  },
})

export default DeviceNotificationTokenCreateMutation
