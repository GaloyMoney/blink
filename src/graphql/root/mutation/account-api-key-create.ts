import { GT } from "@graphql/index"
import Timestamp from "@graphql/types/scalar/timestamp"
import AccountApiKeyPayload from "@graphql/types/payload/account-api-key"
import AccountApiKeyLabel from "@graphql/types/scalar/account-api-key-label"
import { Accounts } from "@app"
import { InputValidationError } from "@graphql/error"

const AccountApiKeyCreateInput = GT.Input({
  name: "AccountApiKeyCreateInput",
  fields: () => ({
    label: { type: AccountApiKeyLabel },
    expireAt: { type: GT.NonNull(Timestamp) },
  }),
})

const AccountApiKeyCreateMutation = GT.Field<
  {
    input: {
      label: string | InputValidationError
      expireAt: Date | InputValidationError
    }
  },
  null,
  GraphQLContextForUser
>({
  type: GT.NonNull(AccountApiKeyPayload),
  args: {
    input: { type: GT.NonNull(AccountApiKeyCreateInput) },
  },
  resolve: async (_, args, { domainUser }) => {
    const { label, expireAt } = args.input

    if (label instanceof InputValidationError) {
      return { errors: [{ message: label.message }] }
    }

    if (expireAt instanceof InputValidationError) {
      return { errors: [{ message: expireAt.message }] }
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
