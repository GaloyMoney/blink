import { GT } from "@graphql/index"

import AdminPushNotificationSendPayload from "@graphql/admin/types/payload/admin-push-notification-send"
import { Admin } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import PushNotificationType from "@graphql/shared/types/scalar/push-notification-type"

const AdminPushNotificationSendInput = GT.Input({
  name: "AdminPushNotificationSendInput",
  fields: () => ({
    accountId: {
      type: GT.NonNull(GT.String),
    },
    title: {
      type: GT.NonNull(GT.String),
    },
    body: {
      type: GT.NonNull(GT.String),
    },
    data: {
      type: GT.Scalar(Object),
    },
    pushNotificationType: {
      type: PushNotificationType,
    },
  }),
})

const AdminPushNotificationSendMutation = GT.Field<
  null,
  GraphQLAdminContext,
  {
    input: {
      accountId: string
      title: string
      body: string
      data?: { [key: string]: string }
      pushNotificationType?: string
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AdminPushNotificationSendPayload),
  args: {
    input: { type: GT.NonNull(AdminPushNotificationSendInput) },
  },
  resolve: async (_, args) => {
    const { accountId, body, title, data, pushNotificationType } = args.input

    const success = await Admin.sendAdminPushNotification({
      accountId,
      title,
      body,
      data,
      pushNotificationType,
    })

    if (success instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(success)] }
    }
    return { errors: [], success: true }
  },
})

export default AdminPushNotificationSendMutation
