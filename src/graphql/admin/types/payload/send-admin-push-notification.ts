import { GT } from "@graphql/index"
import IError from "@graphql/shared/types/abstract/error"

const SendAdminPushNotificationPayload = GT.Object({
  name: "SendAdminPushNotificationPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    success: {
      type: GT.Boolean,
    },
  }),
})

export default SendAdminPushNotificationPayload
