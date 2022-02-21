import { Wallets } from "@app"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"

import LnInvoicePayload from "@graphql/types/payload/ln-invoice"
import Memo from "@graphql/types/scalar/memo"
import Hex32Bytes from "@graphql/types/scalar/hex32bytes"
import CentAmount from "@graphql/types/scalar/cent-amount"
import WalletId from "@graphql/types/scalar/wallet-id"
import { WalletsRepository } from "@services/mongoose"
import { WalletCurrency } from "@domain/wallets"

const LnUsdInvoiceCreateOnBehalfOfRecipientInput = GT.Input({
  name: "LnUsdInvoiceCreateOnBehalfOfRecipientInput",
  fields: () => ({
    recipientWalletId: { type: GT.NonNull(WalletId) },
    amount: { type: GT.NonNull(CentAmount) },
    memo: { type: Memo },
    descriptionHash: { type: Hex32Bytes },
  }),
})

const LnUsdInvoiceCreateOnBehalfOfRecipientMutation = GT.Field({
  type: GT.NonNull(LnInvoicePayload),
  args: {
    input: { type: GT.NonNull(LnUsdInvoiceCreateOnBehalfOfRecipientInput) },
  },
  resolve: async (_, args) => {
    const { recipientWalletId, amount, memo, descriptionHash } = args.input
    for (const input of [recipientWalletId, amount, memo, descriptionHash]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const wallet = await WalletsRepository().findById(recipientWalletId)
    if (wallet instanceof Error)
      return { errors: [{ message: mapError(wallet).message }] }

    const MutationDoesNotMatchWalletCurrencyError =
      "MutationDoesNotMatchWalletCurrencyError"
    if (wallet.currency === WalletCurrency.Btc) {
      return { errors: [{ message: MutationDoesNotMatchWalletCurrencyError }] }
    }

    const invoice = await Wallets.addInvoiceForRecipient({
      recipientWalletId,
      amount,
      memo,
      descriptionHash,
    })

    if (invoice instanceof Error) {
      const appErr = mapError(invoice)
      return { errors: [{ message: appErr.message || appErr.name }] } // TODO: refine error
    }

    return {
      errors: [],
      invoice,
    }
  },
})

export default LnUsdInvoiceCreateOnBehalfOfRecipientMutation
