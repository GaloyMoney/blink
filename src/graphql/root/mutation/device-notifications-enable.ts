import { GT } from "@graphql/index"

import * as Users from "@app/users"

import { mapError } from "@graphql/error-map"
import SuccessPayload from "@graphql/types/payload/success-payload"
import NotificationKey from "@graphql/types/scalar/notification-key"

const DeviceNotificationsEnableInput = new GT.Input({
  name: "DeviceNotificationsEnableInput",
  fields: () => ({
    deviceToken: { type: GT.NonNull(GT.String) },
    notificationKeys: {
      type: GT.NonNullList(NotificationKey),
    },
  }),
})

const DeviceNotificationsEnableMutation = GT.Field({
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(DeviceNotificationsEnableInput) },
  },
  resolve: async (_, args, { user }) => {
    const { deviceToken, notificationKeys } = args.input

    const status = Users.enableNotifications({ user, deviceToken, notificationKeys })

    if (status instanceof Error) {
      const mappedError = mapError(status)
      return { errors: [{ message: mappedError.message }] }
    }

    return { errors: [], success: status }
  },
})

export default DeviceNotificationsEnableMutation
