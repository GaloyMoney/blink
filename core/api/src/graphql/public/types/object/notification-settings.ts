import { NotificationChannelSettings } from "./notification-channel-settings"

import { GT } from "@/graphql/index"

export const NotificationSettings = GT.Object<
  NotificationSettings,
  GraphQLPublicContextAuth
>({
  name: "NotificationSettings",
  fields: () => ({
    push: {
      type: GT.NonNull(NotificationChannelSettings),
      resolve: (source) => source.push,
    },
  }),
})
