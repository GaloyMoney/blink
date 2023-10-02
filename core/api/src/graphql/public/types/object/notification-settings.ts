import { GT } from "@graphql/index"

import { NotificationChannelSettings } from "./notification-channel-settings"

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
