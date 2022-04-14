import { GT } from "@graphql/index"

import AccountDetailPayload from "@graphql/admin/types/payload/account-detail"
import AccountStatus from "@graphql/admin/types/scalar/account-status"
import { Accounts } from "@app"
import { mapError } from "@graphql/error-map"

const AccountUpdateStatusInput = GT.Input({
  name: "AccountUpdateStatusInput",
  fields: () => ({
    uid: {
      type: GT.NonNullID,
    },
    status: {
      type: GT.NonNull(AccountStatus),
    },
    comment: {
      type: GT.String,
    },
  }),
})

const AccountUpdateStatusMutation = GT.Field<{ input }, null, GraphQLContextForUser>({
  type: GT.NonNull(AccountDetailPayload),
  args: {
    input: { type: GT.NonNull(AccountUpdateStatusInput) },
  },
  resolve: async (_, args, { domainUser }) => {
    const { uid, status, comment } = args.input
    for (const input of [uid, status]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const account = await Accounts.updateAccountStatus({
      id: uid,
      status,
      updatedByUserId: domainUser.id,
      comment,
    })
    if (account instanceof Error) {
      return { errors: [{ message: mapError(account).message }] }
    }
    return { errors: [], accountDetails: account }
  },
})

export default AccountUpdateStatusMutation
