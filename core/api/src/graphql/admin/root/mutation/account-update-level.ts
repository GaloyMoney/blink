import { Accounts } from "@/app"
import AccountDetailPayload from "@/graphql/admin/types/payload/account-detail"
import AccountLevel from "@/graphql/shared/types/scalar/account-level"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import AccountId from "@/graphql/shared/types/scalar/account-id"

const AccountUpdateLevelInput = GT.Input({
  name: "AccountUpdateLevelInput",
  fields: () => ({
    accountId: {
      type: GT.NonNull(AccountId),
    },
    level: {
      type: GT.NonNull(AccountLevel),
    },
  }),
})

const AccountUpdateLevelMutation = GT.Field<
  null,
  GraphQLAdminContext,
  {
    input: {
      accountId: AccountId | Error
      level: AccountLevel | Error
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountDetailPayload),
  args: {
    input: { type: GT.NonNull(AccountUpdateLevelInput) },
  },
  resolve: async (_, args) => {
    const { accountId, level } = args.input

    if (level instanceof Error) return { errors: [{ message: level.message }] }
    if (accountId instanceof Error) return { errors: [{ message: accountId.message }] }

    const account = await Accounts.updateAccountLevel({ accountId, level })

    if (account instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(account)] }
    }
    return { errors: [], accountDetails: account }
  },
})

export default AccountUpdateLevelMutation
