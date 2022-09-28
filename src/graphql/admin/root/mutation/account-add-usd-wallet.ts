import { GT } from "@graphql/index"

import { Accounts } from "@app"
import { mapError } from "@graphql/error-map"
import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"
import WalletDetailsPayload from "@graphql/admin/types/payload/wallet-details"

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
  extensions: {
    complexity: 120,
  },
  type: WalletDetailsPayload,
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

    const errors: IError[] = []
    const walletDetails: Wallet[] = []

    addWalletResults.forEach((wallet) => {
      if (wallet instanceof Error) {
        return errors.push({ message: mapError(wallet).message })
      }

      walletDetails.push(wallet)
    })

    return { errors, walletDetails }
  },
})

export default AccountsAddUsdWalletMutation
