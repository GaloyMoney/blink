import { GT } from "@graphql/index"

import PushNotificationType from "@graphql/shared/types/scalar/push-notification-type"
import PushNotificationSubType from "@graphql/shared/types/scalar/push-notification-sub-type"
import AccountUpdatePushNotificationSettingsPayload from "@graphql/public/types/payload/account-update-push-notification-settings"
import { Accounts } from "@app/index"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"

const PushNotificationSettingsInput = GT.Input({
  name: "PushNotificationSettingsInput",
  fields: () => ({
    type: { type: GT.NonNull(PushNotificationType) },
    enabled: { type: GT.NonNull(GT.Boolean) },
    disabledSubtypes: { type: GT.NonNull(GT.List(PushNotificationSubType)) },
  }),
})

const AccountUpdatePushNotificationSettingsInput = GT.Input({
  name: "AccountUpdatePushNotificationSettingsInput",
  fields: () => ({
    enabled: { type: GT.NonNull(GT.Boolean) },
    settings: {
      type: GT.NonNull(GT.List(PushNotificationSettingsInput)),
    },
  }),
})

const AccountUpdatePushNotificationSettingsMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      enabled: boolean
      settings: {
        type: string
        enabled: boolean
        disabledSubtypes: string[]
      }[]
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountUpdatePushNotificationSettingsPayload),
  args: {
    input: { type: GT.NonNull(AccountUpdatePushNotificationSettingsInput) },
  },
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const result = await Accounts.updatePushNotificationSettings({
      accountId: domainAccount.id,
      notificationSettings: args.input,
    })

    if (result instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(result)] }
    }

    return {
      errors: [],
      account: result,
    }
  },
})

export default AccountUpdatePushNotificationSettingsMutation
