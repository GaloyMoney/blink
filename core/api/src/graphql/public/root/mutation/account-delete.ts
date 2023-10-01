import { Accounts } from "@/app"

import { GT } from "@/graphql/index"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import AccountDeletePayload from "@/graphql/public/types/payload/account-delete"

const AccountDeleteMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountDeletePayload),
  resolve: async (_, _args, { domainAccount }: { domainAccount: Account }) => {
    const result = await Accounts.markAccountForDeletion({
      accountId: domainAccount.id,
    })

    if (result instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(result)], success: false }
    }

    return {
      errors: [],
      success: true,
    }
  },
})

export default AccountDeleteMutation
