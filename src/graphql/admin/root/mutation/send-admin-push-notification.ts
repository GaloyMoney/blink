import { GT } from "@graphql/index"

import SendAdminPushNotificationPayload from "@graphql/admin/types/payload/send-admin-push-notification"
import { Admin } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"

const SendAdminPushNotificationInput = GT.Input({
  name: "SendAdminPushNotificationInput",
  fields: () => ({
    accountId: {
      type: GT.String,
    },
    title: {
      type: GT.String,
    },
    body: {
      type: GT.String,
    },
  }),
})

const SendAdminPushNotificationMutation = GT.Field<
  {
    input: { accountId: string; title: string; body: string }
  },
  null,
  GraphQLContextAuth
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SendAdminPushNotificationPayload),
  args: {
    input: { type: GT.NonNull(SendAdminPushNotificationInput) },
  },
  resolve: async (_, args) => {
    const { accountId, body, title } = args.input

    const success = await Admin.sendAdminPushNotification({ accountId, title, body })

    if (success instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(success)] }
    }
    return { errors: [], success: true }
  },
})

export default SendAdminPushNotificationMutation
