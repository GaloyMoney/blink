import { GT } from "@graphql/index"

import { Accounts } from "@app"
import { mapError } from "@graphql/error-map"
import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"
import WalletDetailPayload from "@graphql/admin/types/payload/wallet-detail"

const AccountsAddUsdWalletInput = GT.Input({
  name: "AccountsAddUsdWalletInput",
  fields: () => ({
    accountIds: {
      type: GT.NonNullList(GT.ID),
    },
  }),
})

const AccountsAddUsdWalletMutation = GT.Field<
  {
    input: { accountIds: [string] }
  },
  null,
  GraphQLContextForUser
>({
  type: GT.NonNullList(WalletDetailPayload),
  args: {
    input: { type: GT.NonNull(AccountsAddUsdWalletInput) },
  },
  resolve: async (_, args) => {
    const { accountIds } = args.input
    if (accountIds instanceof Error) {
      return [{ errors: [{ message: accountIds.message }] }]
    }

    const addWalletResults = await Promise.all(
      accountIds.map((accountId) =>
        Accounts.addWalletIfNonexistent({
          accountId: accountId as AccountId,
          type: WalletType.Checking,
          currency: WalletCurrency.Usd,
        }),
      ),
    )
    const walletDetails = addWalletResults.map((wallet) => {
      if (wallet instanceof Error) {
        return { errors: [{ message: mapError(wallet).message }] }
      }

      return { errors: [], walletDetails: wallet }
    })

    return walletDetails
  },
})

export default AccountsAddUsdWalletMutation
