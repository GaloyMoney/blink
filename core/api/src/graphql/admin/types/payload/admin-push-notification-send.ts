import { GT } from "@/graphql/index"
import IError from "@/graphql/shared/types/abstract/error"

const AdminPushNotificationSendPayload = GT.Object({
  name: "AdminPushNotificationSendPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    success: {
      type: GT.Boolean,
    },
  }),
})

export default AdminPushNotificationSendPayload
