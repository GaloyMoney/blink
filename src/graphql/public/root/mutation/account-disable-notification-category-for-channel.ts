import { GT } from "@graphql/index"

import AccountUpdateNotificationSettingsPayload from "@graphql/public/types/payload/account-update-notification-settings"
import { Accounts } from "@app/index"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import NotificationChannel from "@graphql/shared/types/scalar/notification-channel"
import NotificationCategory from "@graphql/shared/types/scalar/notification-category"

const AccountDisableNotificationCategoryForChannelInput = GT.Input({
  name: "AccountDisableNotificationCategoryForChannelInput",
  fields: () => ({
    channel: {
      type: GT.NonNull(NotificationChannel),
    },
    category: {
      type: GT.NonNull(NotificationCategory),
    },
  }),
})

const AccountDisableNotificationCategoryForChannelMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      channel: NotificationChannel | Error
      category: NotificationCategory
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountUpdateNotificationSettingsPayload),
  args: {
    input: { type: GT.NonNull(AccountDisableNotificationCategoryForChannelInput) },
  },
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const { channel, category } = args.input

    if (channel instanceof Error) return { errors: [{ message: channel.message }] }

    const result = await Accounts.disableNotificationCategoryForChannel({
      accountId: domainAccount.id,
      notificationChannel: channel,
      notificationCategory: category,
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

export default AccountDisableNotificationCategoryForChannelMutation
