import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"
import CentAmount from "@graphql/types/scalar/cent-amount"
import LnInvoicePayload from "@graphql/types/payload/ln-invoice"
import { Wallets } from "@app"
import { WalletsRepository } from "@services/mongoose"
import { WalletCurrency } from "@domain/wallets"

const LnUsdInvoiceCreateInput = GT.Input({
  name: "LnUsdInvoiceCreateInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    amount: { type: GT.NonNull(CentAmount) },
    memo: { type: Memo },
  }),
})

const LnUsdInvoiceCreateMutation = GT.Field({
  type: GT.NonNull(LnInvoicePayload),
  args: {
    input: { type: GT.NonNull(LnUsdInvoiceCreateInput) },
  },
  resolve: async (_, args) => {
    const { walletId, memo, amount } = args.input

    for (const input of [walletId, memo, amount]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const wallet = await WalletsRepository().findById(walletId)
    if (wallet instanceof Error)
      return { errors: [{ message: mapError(wallet).message }] }

    const MutationDoesNotMatchWalletCurrencyError =
      "MutationDoesNotMatchWalletCurrencyError"
    if (wallet.currency === WalletCurrency.Btc) {
      return { errors: [{ message: MutationDoesNotMatchWalletCurrencyError }] }
    }

    const lnInvoice = await Wallets.addInvoiceForSelf({
      walletId,
      amount,
      memo,
    })

    if (lnInvoice instanceof Error) {
      const appErr = mapError(lnInvoice)
      return { errors: [{ message: appErr.message }] }
    }

    return {
      errors: [],
      invoice: lnInvoice,
    }
  },
})

export default LnUsdInvoiceCreateMutation
