import addInvoiceForRecipient from "@core/lightning/add-invoice-for-recipient"
import { GT } from "@graphql/index"

import LnNoAmountInvoicePayload from "../payloads/ln-noamount-invoice"
import Memo from "../scalars/memo"
import Username from "../scalars/username"

const LnNoAmountInvoiceCreateOnBehalfOfRecipientInput = new GT.Input({
  name: "LnNoAmountInvoiceCreateOnBehalfOfRecipientInput",
  fields: () => ({
    recipient: { type: GT.NonNull(Username) },
    memo: { type: Memo },
  }),
})

const LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation = {
  type: GT.NonNull(LnNoAmountInvoicePayload),
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoiceCreateOnBehalfOfRecipientInput) },
  },
  resolve: async (_, args, { logger }) => {
    const { recipient, memo } = args.input

    if (memo instanceof Error) {
      return { errors: [{ message: memo.message }] }
    }

    const result = await addInvoiceForRecipient(
      {
        recipient,
        memo,
      },
      { logger },
    )

    if (result instanceof Error) {
      return { errors: [{ message: result.message }] } // TODO: refine error
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
}

export default LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation
