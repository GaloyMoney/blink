import { GT } from "@graphql/index"
import { disableApiKey } from "@app/accounts"
import SuccessPayload from "@graphql/types/payload/success-payload"
import AccountApiKeyLabel from "@graphql/types/scalar/account-api-key-label"

const AccountApiKeyDisableInput = new GT.Input({
  name: "AccountApiKeyDisableInput",
  fields: () => ({
    label: { type: GT.NonNull(AccountApiKeyLabel) },
  }),
})

const AccountApiKeyDisableMutation = GT.Field({
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(AccountApiKeyDisableInput) },
  },
  resolve: async (_, args, { domainUser }) => {
    const { label } = args.input

    if (label instanceof Error) {
      return { errors: [{ message: label.message }], success: false }
    }

    const accountId = domainUser.defaultAccountId
    const result = await disableApiKey({ accountId, label })

    if (result instanceof Error) {
      const { message, name } = result
      return { errors: [{ message: message || name }], success: false }
    }

    return {
      errors: [],
      success: true,
    }
  },
})

export default AccountApiKeyDisableMutation
