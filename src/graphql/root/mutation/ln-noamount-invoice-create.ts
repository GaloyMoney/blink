import { GT } from "@graphql/index"

import LnNoAmountInvoicePayload from "@graphql/types/payload/ln-noamount-invoice"
import Memo from "@graphql/types/scalar/memo"
import { addInvoiceNoAmount } from "@app/wallets/add-invoice-for-wallet"

const LnNoAmountInvoiceCreateInput = new GT.Input({
  name: "LnNoAmountInvoiceCreateInput",
  fields: () => ({
    memo: { type: Memo },
  }),
})

const LnNoAmountInvoiceCreateMutation = GT.Field({
  type: GT.NonNull(LnNoAmountInvoicePayload),
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoiceCreateInput) },
  },
  resolve: async (_, args, { user }) => {
    const { memo } = args.input

    if (memo instanceof Error) {
      return { errors: [{ message: memo.message }] }
    }

    const lnInvoice = await addInvoiceNoAmount({
      walletId: user.id, // TODO: should this be changed to not depend on context?
      memo,
    })

    if (lnInvoice instanceof Error) {
      return { errors: [{ message: lnInvoice.message || lnInvoice.name }] } // TODO: refine error
    }

    return {
      errors: [],
      invoice: lnInvoice,
    }
  },
})

export default LnNoAmountInvoiceCreateMutation
