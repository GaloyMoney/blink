import { Accounts } from "@/app"
import AccountDetailPayload from "@/graphql/admin/types/payload/account-detail"
import AccountLevel from "@/graphql/shared/types/scalar/account-level"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import AccountUuid from "@/graphql/shared/types/scalar/account-uuid"

const AccountUpdateLevelInput = GT.Input({
  name: "AccountUpdateLevelInput",
  fields: () => ({
    accountUuid: {
      type: GT.NonNull(AccountUuid),
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
      accountUuid: AccountUuid | Error
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
    const { accountUuid, level } = args.input

    if (level instanceof Error) return { errors: [{ message: level.message }] }
    if (accountUuid instanceof Error)
      return { errors: [{ message: accountUuid.message }] }

    const account = await Accounts.updateAccountLevel({ accountUuid, level })

    if (account instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(account)] }
    }
    return { errors: [], accountDetails: account }
  },
})

export default AccountUpdateLevelMutation
