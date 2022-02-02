import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"
import LnNoAmountInvoicePayload from "@graphql/types/payload/ln-noamount-invoice"
import { Wallets } from "@app"

const LnNoAmountInvoiceCreateInput = GT.Input({
  name: "LnNoAmountInvoiceCreateInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    memo: { type: Memo },
  }),
})

const LnNoAmountInvoiceCreateMutation = GT.Field({
  type: GT.NonNull(LnNoAmountInvoicePayload),
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoiceCreateInput) },
  },
  resolve: async (_, args) => {
    const { walletId, memo } = args.input

    for (const input of [walletId, memo]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
      walletId,
      memo,
    })

    if (lnInvoice instanceof Error) {
      const appErr = mapError(lnInvoice)
      return { errors: [{ message: appErr.message }] }
    }

    return {
      errors: [],
      invoice: lnInvoice,
    }
  },
})

export default LnNoAmountInvoiceCreateMutation
