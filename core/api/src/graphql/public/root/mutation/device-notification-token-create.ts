import { GT } from "@/graphql/index"

import SuccessPayload from "@/graphql/shared/types/payload/success-payload"

import { Users } from "@/app"
import { parseErrorMessageFromUnknown } from "@/domain/shared"

const DeviceNotificationTokenCreateInput = GT.Input({
  name: "DeviceNotificationTokenCreateInput",
  fields: () => ({
    deviceToken: { type: GT.NonNull(GT.String) },
  }),
})

const DeviceNotificationTokenCreateMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  { input: { deviceToken: string } }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(DeviceNotificationTokenCreateInput) },
  },
  resolve: async (_, args, { user }) => {
    const { deviceToken } = args.input

    try {
      await Users.addDeviceToken({ userId: user.id, deviceToken })
    } catch (err) {
      return { errors: [{ message: parseErrorMessageFromUnknown(err) }] }
    }

    return { errors: [], success: true }
  },
})

export default DeviceNotificationTokenCreateMutation
