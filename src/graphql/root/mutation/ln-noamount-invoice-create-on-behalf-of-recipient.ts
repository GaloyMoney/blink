import { Wallets } from "@app"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"
import LnNoAmountInvoicePayload from "@graphql/types/payload/ln-noamount-invoice"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"

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
