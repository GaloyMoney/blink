import dedent from "dedent"

import { Wallets } from "@app"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import Memo from "@graphql/types/scalar/memo"
import Callback from "@graphql/types/scalar/callback"
import WalletId from "@graphql/types/scalar/wallet-id"
import LnNoAmountInvoicePayload from "@graphql/types/payload/ln-noamount-invoice"

const LnNoAmountInvoiceCreateOnBehalfOfRecipientInput = GT.Input({
  name: "LnNoAmountInvoiceCreateOnBehalfOfRecipientInput",
  fields: () => ({
    recipientWalletId: {
      type: GT.NonNull(WalletId),
      description:
        "ID for either a USD or BTC wallet which belongs to the account of any user.",
    },
    memo: { type: Memo, description: "Optional memo for the lightning invoice." },
    callback: {
      type: Callback,
      description: "Optional callback for the lightning invoice updates.",
    },
  }),
})

const LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation = GT.Field({
  type: GT.NonNull(LnNoAmountInvoicePayload),
  description: dedent`Returns a lightning invoice for an associated wallet.
  Can be used to receive any supported currency value (currently USD or BTC).
  Expires after 24 hours.`,
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoiceCreateOnBehalfOfRecipientInput) },
  },
  resolve: async (_, args) => {
    const { recipientWalletId, memo, callback } = args.input

    for (const input of [recipientWalletId, memo, callback]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const result = await Wallets.addInvoiceNoAmountForRecipient({
      recipientWalletId,
      memo,
      callback,
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
