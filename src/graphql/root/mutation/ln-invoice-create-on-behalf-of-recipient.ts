import { addInvoiceForRecipient } from "@app/wallets"
import { GT } from "@graphql/index"

import LnInvoicePayload from "@graphql/types/payload/ln-invoice"
import Memo from "@graphql/types/scalar/memo"
import SatAmount from "@graphql/types/scalar/sat-amount"
import WalletName from "@graphql/types/scalar/wallet-name"

const LnInvoiceCreateOnBehalfOfRecipientInput = new GT.Input({
  name: "LnInvoiceCreateOnBehalfOfRecipientInput",
  fields: () => ({
    recipient: { type: GT.NonNull(WalletName) },
    amount: { type: GT.NonNull(SatAmount) },
    memo: { type: Memo },
  }),
})

const LnInvoiceCreateOnBehalfOfRecipientMutation = GT.Field({
  type: GT.NonNull(LnInvoicePayload),
  args: {
    input: { type: GT.NonNull(LnInvoiceCreateOnBehalfOfRecipientInput) },
  },
  resolve: async (_, args) => {
    const { recipient, amount, memo } = args.input
    for (const input of [recipient, amount, memo]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const result = await addInvoiceForRecipient({
      recipient,
      amount,
      memo,
    })

    if (result instanceof Error) {
      return { errors: [{ message: result.message || result.name }] } // TODO: refine error
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
