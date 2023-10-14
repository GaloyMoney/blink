import { GT } from "@/graphql/index"

import AccountDetailPayload from "@/graphql/admin/types/payload/account-detail"
import AccountStatus from "@/graphql/admin/types/scalar/account-status"
import { Accounts } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import AccountId from "@/graphql/shared/types/scalar/account-id"

const AccountUpdateStatusInput = GT.Input({
  name: "AccountUpdateStatusInput",
  fields: () => ({
    accountId: {
      type: GT.NonNull(AccountId),
    },
    status: {
      type: GT.NonNull(AccountStatus),
    },
    comment: {
      type: GT.String,
    },
  }),
})

const AccountUpdateStatusMutation = GT.Field<
  null,
  GraphQLAdminContext,
  {
    input: {
      accountId: AccountId | Error
      status: AccountStatus | Error
      comment: string
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountDetailPayload),
  args: {
    input: { type: GT.NonNull(AccountUpdateStatusInput) },
  },
  resolve: async (_, args, { privilegedClientId }) => {
    const { accountId, status, comment } = args.input

    if (status instanceof Error) return { errors: [{ message: status.message }] }
    if (accountId instanceof Error) return { errors: [{ message: accountId.message }] }

    const account = await Accounts.updateAccountStatus({
      accountId,
      status,
      updatedByPrivilegedClientId: privilegedClientId,
      comment,
    })
    if (account instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(account)] }
    }
    return { errors: [], accountDetails: account }
  },
})

export default AccountUpdateStatusMutation
