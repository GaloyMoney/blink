import { GT } from "@graphql/index"

import LnNoAmountInvoicePayload from "./payload/ln-noamount-invoice"
import Memo from "../scalar/memo"
import { addInvoiceNoAmount } from "@app/wallets/add-invoice-for-wallet"

const LnNoAmountInvoiceCreateInput = new GT.Input({
  name: "LnNoAmountInvoiceCreateInput",
  fields: () => ({
    memo: { type: Memo },
  }),
})

const LnNoAmountInvoiceCreateMutation = {
  type: GT.NonNull(LnNoAmountInvoicePayload),
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoiceCreateInput) },
  },
  resolve: async (_, args, { user }) => {
    const { memo } = args.input

    if (memo instanceof Error) {
      return { errors: [{ message: memo.message }] }
    }

    if (!user) {
      return { errors: [{ message: "Invalid user operation" }] }
    }

    const lnInvoice = await addInvoiceNoAmount({
      walletId: user.id, // TODO: should this be changed to not depend on context?
      memo,
    })

    if (lnInvoice instanceof Error) {
      return { errors: [{ message: lnInvoice.message }] } // TODO: refine error
    }

    const { paymentRequest, paymentHash, paymentSecret } = lnInvoice

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

export default LnNoAmountInvoiceCreateMutation
