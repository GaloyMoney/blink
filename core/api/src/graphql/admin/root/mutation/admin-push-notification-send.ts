import { GT } from "@/graphql/index"

import AdminPushNotificationSendPayload from "@/graphql/admin/types/payload/admin-push-notification-send"
import { Admin } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import NotificationCategory from "@/graphql/shared/types/scalar/notification-category"

const AdminPushNotificationSendInput = GT.Input({
  name: "AdminPushNotificationSendInput",
  fields: () => ({
    accountUuid: {
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
    notificationCategory: {
      type: NotificationCategory,
    },
  }),
})

const AdminPushNotificationSendMutation = GT.Field<
  null,
  GraphQLAdminContext,
  {
    input: {
      accountUuid: string
      title: string
      body: string
      data?: { [key: string]: string }
      notificationCategory?: string
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
    const { accountUuid, body, title, data, notificationCategory } = args.input

    const success = await Admin.sendAdminPushNotification({
      accountUuid,
      title,
      body,
      data,
      notificationCategory,
    })

    if (success instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(success)] }
    }
    return { errors: [], success: true }
  },
})

export default AdminPushNotificationSendMutation
