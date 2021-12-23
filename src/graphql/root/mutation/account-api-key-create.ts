import { GT } from "@graphql/index"
import { Accounts } from "@app"
import Timestamp from "@graphql/types/scalar/timestamp"
import AccountApiKeyPayload from "@graphql/types/payload/account-api-key"
import AccountApiKeyLabel from "@graphql/types/scalar/account-api-key-label"

const AccountApiKeyCreateInput = new GT.Input({
  name: "AccountApiKeyCreateInput",
  fields: () => ({
    label: { type: AccountApiKeyLabel },
    expireAt: { type: GT.NonNull(Timestamp) },
  }),
})

const AccountApiKeyCreateMutation = GT.Field({
  type: GT.NonNull(AccountApiKeyPayload),
  args: {
    input: { type: GT.NonNull(AccountApiKeyCreateInput) },
  },
  resolve: async (_, args, { domainUser }) => {
    const { label, expireAt } = args.input

    for (const input of [label, expireAt]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const accountId = domainUser.defaultAccountId
    const accountApiKey = await Accounts.addApiKeyForAccount({
      accountId,
      label,
      expireAt,
    })

    if (accountApiKey instanceof Error) {
      const { message, name } = accountApiKey
      return { errors: [{ message: message || name }] }
    }

    return {
      errors: [],
      accountApiKey,
    }
  },
})

export default AccountApiKeyCreateMutation
