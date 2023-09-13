import { GT } from "@graphql/index"
import PushNotificationSubType from "@graphql/shared/types/scalar/push-notification-sub-type"
import PushNotificationType from "@graphql/shared/types/scalar/push-notification-type"

export const PushNotificationSettings = GT.Object<
  PushNotificationSettings,
  GraphQLPublicContextAuth
>({
  name: "PushNotificationSettings",
  fields: () => ({
    enabled: {
      type: GT.NonNull(GT.Boolean),
      resolve: (source) => source.enabled,
    },
    settings: {
      type: GT.NonNull(GT.List(PushNotificationSetting)),
      resolve: (source) => source.settings,
    },
  }),
})

export const PushNotificationSetting = GT.Object<
  PushNotificationSetting,
  GraphQLPublicContextAuth
>({
  name: "PushNotificationSetting",
  fields: () => ({
    type: {
      type: GT.NonNull(PushNotificationType),

      resolve: (source) => source.type,
    },
    enabled: {
      type: GT.NonNull(GT.Boolean),
      resolve: (source) => source.enabled,
    },
    disabledSubtypes: {
      type: GT.NonNull(GT.List(PushNotificationSubType)),
      resolve: (source) => source.disabledSubtypes,
    },
  }),
})
