import { GT } from "@/graphql/index"

import AccountUpdateNotificationSettingsPayload from "@/graphql/public/types/payload/account-update-notification-settings"
import { Accounts } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import NotificationChannel from "@/graphql/shared/types/scalar/notification-channel"

const AccountEnableNotificationChannelInput = GT.Input({
  name: "AccountEnableNotificationChannelInput",
  fields: () => ({
    channel: {
      type: GT.NonNull(NotificationChannel),
    },
  }),
})

const AccountEnableNotificationChannelMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      channel: NotificationChannel | Error
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountUpdateNotificationSettingsPayload),
  args: {
    input: { type: GT.NonNull(AccountEnableNotificationChannelInput) },
  },
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const { channel } = args.input

    if (channel instanceof Error) return { errors: [{ message: channel.message }] }

    const result = await Accounts.enableNotificationChannel({
      accountId: domainAccount.id,
      notificationChannel: channel,
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

export default AccountEnableNotificationChannelMutation
