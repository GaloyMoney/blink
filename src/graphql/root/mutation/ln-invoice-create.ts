import { GT } from "@graphql/index"

import LnInvoicePayload from "@graphql/types/payload/ln-invoice"
import Memo from "@graphql/types/scalar/memo"
import { addInvoice } from "@app/wallets/add-invoice-for-wallet"
import SatAmount from "@graphql/types/scalar/sat-amount"

const LnInvoiceCreateInput = new GT.Input({
  name: "LnInvoiceCreateInput",
  fields: () => ({
    amount: { type: GT.NonNull(SatAmount) },
    memo: { type: Memo },
  }),
})

const LnInvoiceCreateMutation = GT.Field({
  type: GT.NonNull(LnInvoicePayload),
  args: {
    input: { type: GT.NonNull(LnInvoiceCreateInput) },
  },
  resolve: async (_, args, { user }) => {
    const { memo, amount } = args.input

    if (memo instanceof Error) {
      return { errors: [{ message: memo.message }] }
    }

    const lnInvoice = await addInvoice({
      walletId: user.id, // TODO: should this be changed to not depend on context?
      amount,
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
})

export default LnInvoiceCreateMutation
