import { MAX_BYTES_FOR_MEMO } from "@config/app"
import LnInvoiceWrapper from "@core/lightning/invoice"
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

    const errors: UserError[] = []

    if (memo && Buffer.byteLength(memo, "utf8") > MAX_BYTES_FOR_MEMO) {
      errors.push({ message: "Memo field is too long" })
    }

    if (errors.length > 0) {
      return { errors, invoice: null }
    }

    const { paymentRequest, paymentHash, paymentSecret } = await LnInvoiceWrapper({
      logger,
    }).addForUsername(recipient, { memo })

    return {
      errors,
      invoice: {
        paymentRequest,
        paymentHash,
        paymentSecret,
      },
    }
  },
}

export default LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation
