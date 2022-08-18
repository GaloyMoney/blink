import dedent from "dedent"

import { Wallets } from "@app"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import Memo from "@graphql/types/scalar/memo"
import Callback from "@graphql/types/scalar/callback"
import WalletId from "@graphql/types/scalar/wallet-id"
import LnNoAmountInvoicePayload from "@graphql/types/payload/ln-noamount-invoice"

const LnNoAmountInvoiceCreateInput = GT.Input({
  name: "LnNoAmountInvoiceCreateInput",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
      description:
        "ID for either a USD or BTC wallet belonging to the account of the current user.",
    },
    memo: { type: Memo, description: "Optional memo for the lightning invoice." },
    callback: {
      type: Callback,
      description: "Optional callback for the lightning invoice updates.",
    },
  }),
})

const LnNoAmountInvoiceCreateMutation = GT.Field({
  type: GT.NonNull(LnNoAmountInvoicePayload),
  description: dedent`Returns a lightning invoice for an associated wallet.
  Can be used to receive any supported currency value (currently USD or BTC).
  Expires after 24 hours.`,
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoiceCreateInput) },
  },
  resolve: async (_, args) => {
    const { walletId, memo, callback } = args.input

    for (const input of [walletId, memo, callback]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
      walletId,
      memo,
      callback,
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
