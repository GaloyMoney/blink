import { GT } from "@graphql/index"

import PushNotificationType from "@graphql/shared/types/scalar/push-notification-type"
import AccountUpdatePushNotificationSettingsPayload from "@graphql/public/types/payload/account-update-push-notification-settings"
import { Accounts } from "@app/index"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"

const AccountUpdatePushNotificationSettingsInput = GT.Input({
  name: "AccountUpdatePushNotificationSettingsInput",
  fields: () => ({
    pushNotificationsEnabled: {
      type: GT.NonNull(GT.Boolean),
    },
    disabledPushNotificationTypes: {
      type: GT.NonNull(GT.List(PushNotificationType)),
    },
  }),
})

const AccountUpdatePushNotificationSettingsMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      disabledPushNotificationTypes: string[]
      pushNotificationsEnabled: boolean
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
    const { disabledPushNotificationTypes, pushNotificationsEnabled } = args.input
    const result = await Accounts.updatePushNotificationSettings({
      accountId: domainAccount.id,
      disabledPushNotificationTypes,
      pushNotificationsEnabled,
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
