import { addInvoiceForRecipient } from "@app/wallets"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"

import LnInvoicePayload from "@graphql/types/payload/ln-invoice"
import Memo from "@graphql/types/scalar/memo"
import Hex32Bytes from "@graphql/types/scalar/hex32bytes"
import SatAmount from "@graphql/types/scalar/sat-amount"
import WalletId from "@graphql/types/scalar/wallet-id"

const LnInvoiceCreateOnBehalfOfRecipientInput = new GT.Input({
  name: "LnInvoiceCreateOnBehalfOfRecipientInput",
  fields: () => ({
    recipientWalletId: { type: GT.NonNull(WalletId) },
    amount: { type: GT.NonNull(SatAmount) },
    memo: { type: Memo },
    descriptionHash: { type: Hex32Bytes },
  }),
})

const LnInvoiceCreateOnBehalfOfRecipientMutation = GT.Field({
  type: GT.NonNull(LnInvoicePayload),
  args: {
    input: { type: GT.NonNull(LnInvoiceCreateOnBehalfOfRecipientInput) },
  },
  resolve: async (_, args) => {
    const { recipientWalletId, amount, memo, descriptionHash } = args.input
    for (const input of [recipientWalletId, amount, memo, descriptionHash]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const result = await addInvoiceForRecipient({
      recipientWalletPublicId: recipientWalletId,
      amount,
      memo,
      descriptionHash,
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

export default LnInvoiceCreateOnBehalfOfRecipientMutation
