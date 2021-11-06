import { GT } from "@graphql/index"

import * as Users from "@app/users"

import { mapError } from "@graphql/error-map"
import SuccessPayload from "@graphql/types/payload/success-payload"
import NotificationKey from "@graphql/types/scalar/notification-key"

const DeviceNotificationsDisableInput = new GT.Input({
  name: "DeviceNotificationsDisableInput",
  fields: () => ({
    notificationKeys: {
      type: GT.NonNullList(NotificationKey),
    },
  }),
})

const DeviceNotificationsDisable = GT.Field({
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(DeviceNotificationsDisableInput) },
  },

  resolve: async (_, args, { user }) => {
    const { notificationKeys } = args.input

    const status = Users.disableNotifications({ user, notificationKeys })

    if (status instanceof Error) {
      const mappedError = mapError(status)
      return { errors: [{ message: mappedError.message }] }
    }

    return { errors: [], success: status }
  },
})

export default DeviceNotificationsDisable
