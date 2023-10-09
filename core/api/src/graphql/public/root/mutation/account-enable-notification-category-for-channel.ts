import { GT } from "@/graphql/index"

import AccountUpdateNotificationSettingsPayload from "@/graphql/public/types/payload/account-update-notification-settings"
import { Accounts } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import NotificationChannel from "@/graphql/shared/types/scalar/notification-channel"
import NotificationCategory from "@/graphql/shared/types/scalar/notification-category"

const AccountEnableNotificationCategoryInput = GT.Input({
  name: "AccountEnableNotificationCategoryInput",
  fields: () => ({
    channel: {
      type: NotificationChannel,
    },
    category: {
      type: GT.NonNull(NotificationCategory),
    },
  }),
})

const AccountEnableNotificationCategoryMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      channel?: NotificationChannel | Error
      category: NotificationCategory
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountUpdateNotificationSettingsPayload),
  args: {
    input: { type: GT.NonNull(AccountEnableNotificationCategoryInput) },
  },
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const { channel, category } = args.input

    if (channel instanceof Error) return { errors: [{ message: channel.message }] }

    const result = await Accounts.enableNotificationCategory({
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

export default AccountEnableNotificationCategoryMutation
