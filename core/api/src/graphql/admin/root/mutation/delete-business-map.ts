import { Merchants } from "@/app"
import AccountDetailPayload from "@/graphql/admin/types/payload/account-detail"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import Username from "@/graphql/shared/types/scalar/username"

const BusinessDeleteMapInfoInput = GT.Input({
  name: "BusinessDeleteMapInfoInput",
  fields: () => ({
    username: {
      type: GT.NonNull(Username),
    },
  }),
})

const BusinessDeleteMapInfoMutation = GT.Field<
  null,
  GraphQLAdminContext,
  {
    input: {
      username: Username | InputValidationError
    }
  }
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

    const account = await Merchants.deleteMerchantByUsername({ username })

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
