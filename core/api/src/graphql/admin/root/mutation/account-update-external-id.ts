import { GT } from "@/graphql/index"

import { Accounts } from "@/app"
import AccountDetailPayload from "@/graphql/admin/types/payload/account-detail"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import AccountId from "@/graphql/shared/types/scalar/account-id"
import ExternalId from "@/graphql/shared/types/scalar/external-id"

const AccountUpdateExternalIdInput = GT.Input({
  name: "AccountUpdateExternalIdInput",
  fields: () => ({
    accountId: {
      type: GT.NonNull(AccountId),
    },
    externalId: {
      type: GT.NonNull(ExternalId),
    },
  }),
})

const AccountUpdateExternalIdMutation = GT.Field<
  null,
  GraphQLAdminContext,
  {
    input: {
      accountId: AccountId | Error
      externalId: ExternalId | Error
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountDetailPayload),
  args: {
    input: { type: GT.NonNull(AccountUpdateExternalIdInput) },
  },
  resolve: async (_, args) => {
    const { accountId, externalId } = args.input

    if (accountId instanceof Error) return { errors: [{ message: accountId.message }] }
    if (externalId instanceof Error) return { errors: [{ message: externalId.message }] }

    const account = await Accounts.updateAccountExternalId({
      accountId,
      externalId,
    })
    if (account instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(account)] }
    }
    return { errors: [], accountDetails: account }
  },
})

export default AccountUpdateExternalIdMutation
