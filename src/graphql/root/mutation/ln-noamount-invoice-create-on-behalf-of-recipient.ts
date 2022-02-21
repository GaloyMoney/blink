import { Wallets } from "@app"
import { WalletCurrency } from "@domain/wallets"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"

import LnNoAmountInvoicePayload from "@graphql/types/payload/ln-noamount-invoice"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"
import { WalletsRepository } from "@services/mongoose"

const LnNoAmountInvoiceCreateOnBehalfOfRecipientInput = GT.Input({
  name: "LnNoAmountInvoiceCreateOnBehalfOfRecipientInput",
  fields: () => ({
    recipientWalletId: { type: GT.NonNull(WalletId) },
    memo: { type: Memo },
  }),
})

const LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation = GT.Field({
  type: GT.NonNull(LnNoAmountInvoicePayload),
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoiceCreateOnBehalfOfRecipientInput) },
  },
  resolve: async (_, args) => {
    const { recipientWalletId, memo } = args.input

    for (const input of [recipientWalletId, memo]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const wallet = await WalletsRepository().findById(recipientWalletId)
    if (wallet instanceof Error)
      return { errors: [{ message: mapError(wallet).message }] }

    const MutationDoesNotMatchWalletCurrencyError =
      "MutationDoesNotMatchWalletCurrencyError"
    if (wallet.currency === WalletCurrency.Usd) {
      return { errors: [{ message: MutationDoesNotMatchWalletCurrencyError }] }
    }

    const result = await Wallets.addInvoiceNoAmountForRecipient({
      recipientWalletId,
      memo,
    })

    if (result instanceof Error) {
      const appErr = mapError(result)
      return { errors: [{ message: appErr.message || appErr.name }] } // TODO: refine error
    }

    const { paymentRequest, paymentHash, paymentSecret } = result

    return {
      errors: [],
      invoice: {
        paymentRequest,
        paymentHash,
        paymentSecret,
      },
    }
  },
})

export default LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation
