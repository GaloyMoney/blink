import { Accounts } from "@app"
import AccountDetailPayload from "@graphql/admin/types/payload/account-detail"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { GT } from "@graphql/index"
import Username from "@graphql/types/scalar/username"

const BusinessDeleteMapInfoInput = GT.Input({
  name: "BusinessDeleteMapInfoInput",
  fields: () => ({
    username: {
      type: GT.NonNull(Username),
    },
  }),
})

const BusinessDeleteMapInfoMutation = GT.Field<
  {
    input: {
      username: Username | InputValidationError
    }
  },
  null,
  GraphQLContextAuth
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountDetailPayload),
  args: {
    input: { type: GT.NonNull(BusinessDeleteMapInfoInput) },
  },
  resolve: async (_, args) => {
    const { username } = args.input

    if (username instanceof Error) {
      return { errors: [{ message: username.message }] }
    }

    const account = await Accounts.deleteBusinessMapInfo({ username })

    if (account instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(account)] }
    }

    return {
      errors: [],
      accountDetails: account,
    }
  },
})

export default BusinessDeleteMapInfoMutation
