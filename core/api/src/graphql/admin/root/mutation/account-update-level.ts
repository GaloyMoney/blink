import { Accounts } from "@/app"
import AccountDetailPayload from "@/graphql/admin/types/payload/account-detail"
import AccountLevel from "@/graphql/shared/types/scalar/account-level"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"

const AccountUpdateLevelInput = GT.Input({
  name: "AccountUpdateLevelInput",
  fields: () => ({
    // FIXME: should be account id
    uid: {
      type: GT.NonNullID,
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
      uid: string | Error
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
    const { uid, level } = args.input

    if (level instanceof Error) return { errors: [{ message: level.message }] }
    if (uid instanceof Error) return { errors: [{ message: uid.message }] }

    const account = await Accounts.updateAccountLevel({ accountId: uid, level })

    if (account instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(account)] }
    }
    return { errors: [], accountDetails: account }
  },
})

export default AccountUpdateLevelMutation
