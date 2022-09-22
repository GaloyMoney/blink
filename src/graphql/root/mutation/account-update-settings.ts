import { Accounts } from "@app"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"

import AccountUpdateSettingsPayload from "@graphql/types/payload/account-update-settings"

const AccountUpdateSettingsInput = GT.Input({
  name: "AccountUpdateSettingsInput",
  fields: () => ({
    contactEnabled: { type: GT.NonNull(GT.Boolean), defaultValue: true },
  }),
})

const AccountUpdateSettingsMutation = GT.Field({
  type: GT.NonNull(AccountUpdateSettingsPayload),
  args: {
    input: { type: GT.NonNull(AccountUpdateSettingsInput) },
  },
  resolve: async (_, args, { domainAccount }: GraphQLContextForUser) => {
    const { contactEnabled } = args.input

    if (contactEnabled instanceof Error) {
      return { errors: [{ message: contactEnabled.message }] }
    }

    const result = await Accounts.updateAccountSettings({
      accountId: domainAccount.id,
      contactEnabled,
    })

    if (result instanceof Error) {
      const appErr = mapError(result)
      return { errors: [{ message: appErr.message || appErr.name }] }
    }

    return {
      errors: [],
      settings: result,
    }
  },
})

export default AccountUpdateSettingsMutation
