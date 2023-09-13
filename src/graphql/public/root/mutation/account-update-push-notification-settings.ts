import { GT } from "@graphql/index"

import PushNotificationType from "@graphql/shared/types/scalar/push-notification-type"
import PushNotificationSubType from "@graphql/shared/types/scalar/push-notification-sub-type"
import AccountUpdatePushNotificationSettingsPayload from "@graphql/public/types/payload/account-update-push-notification-settings"

const PushNotifcationSettingsInput = GT.Input({
  name: "PushNotifcationSettingsInput",
  fields: () => ({
    type: { type: GT.NonNull(PushNotificationType) },
    enabled: { type: GT.NonNull(GT.Boolean) },
    disabledSubtypes: { type: GT.NonNull(GT.List(PushNotificationSubType)) },
  }),
})

const AccountUpdatePushNotificationSettingsInput = GT.Input({
  name: "AccountUpdatePushNotificationSettingsInput",
  fields: () => ({
    notificationsEnabled: { type: GT.NonNull(GT.Boolean) },
    notificationSettings: {
      type: GT.NonNull(GT.List(PushNotifcationSettingsInput)),
    },
  }),
})

const AccountUpdatePushNotificationSettingsMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountUpdatePushNotificationSettingsPayload),
  args: {
    input: { type: GT.NonNull(AccountUpdatePushNotificationSettingsInput) },
  },
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    return {
      errors: [],
    }
  },
})

export default AccountUpdatePushNotificationSettingsMutation
