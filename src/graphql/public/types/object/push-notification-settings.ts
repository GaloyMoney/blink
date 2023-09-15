import { GT } from "@graphql/index"
import PushNotificationType from "@graphql/shared/types/scalar/push-notification-type"

export const PushNotificationSettings = GT.Object<
  PushNotificationSettings,
  GraphQLPublicContextAuth
>({
  name: "PushNotificationSettings",
  fields: () => ({
    pushNotificationsEnabled: {
      type: GT.NonNull(GT.Boolean),
      resolve: (source) => source.pushNotificationsEnabled,
    },
    disabledPushNotificationTypes: {
      type: GT.NonNull(GT.NonNullList(PushNotificationType)),
      resolve: (source) => source.disabledPushNotificationTypes,
    },
  }),
})
