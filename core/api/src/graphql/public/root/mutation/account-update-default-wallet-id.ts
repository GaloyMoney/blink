import { Accounts } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"

import AccountUpdateDefaultWalletIdPayload from "@/graphql/public/types/payload/account-update-default-wallet-id"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"

const AccountUpdateDefaultWalletIdInput = GT.Input({
  name: "AccountUpdateDefaultWalletIdInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
  }),
})

const AccountUpdateDefaultWalletIdMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountUpdateDefaultWalletIdPayload),
  args: {
    input: { type: GT.NonNull(AccountUpdateDefaultWalletIdInput) },
  },
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const { walletId } = args.input

    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    const result = await Accounts.updateDefaultWalletId({
      walletId,
      accountId: domainAccount.id,
    })

    if (result instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(result)] }
    }

    return {
      errors: [],

      account: result,
    }
  },
})

export default AccountUpdateDefaultWalletIdMutation
