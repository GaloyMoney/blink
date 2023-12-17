import { GT } from "@/graphql/index"
import NotificationCategory from "@/graphql/shared/types/scalar/notification-category"

export const NotificationChannelSettings = GT.Object<
  NotificationChannelSettings,
  GraphQLPublicContextAuth
>({
  name: "NotificationChannelSettings",
  fields: () => ({
    enabled: {
      type: GT.NonNull(GT.Boolean),
      resolve: (source) => source.enabled,
    },
    disabledCategories: {
      type: GT.NonNullList(NotificationCategory),
      resolve: (source) => source.disabledCategories,
    },
  }),
})
