import dedent from "dedent"

import { Wallets } from "@app"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import Memo from "@graphql/types/scalar/memo"
import Callback from "@graphql/types/scalar/callback"
import WalletId from "@graphql/types/scalar/wallet-id"
import Hex32Bytes from "@graphql/types/scalar/hex32bytes"
import SatAmount from "@graphql/types/scalar/sat-amount"
import LnInvoicePayload from "@graphql/types/payload/ln-invoice"
import { validateIsBtcWalletForMutation } from "@graphql/helpers"

const LnInvoiceCreateOnBehalfOfRecipientInput = GT.Input({
  name: "LnInvoiceCreateOnBehalfOfRecipientInput",
  fields: () => ({
    recipientWalletId: {
      type: GT.NonNull(WalletId),
      description: "Wallet ID for a BTC wallet which belongs to any account.",
    },
    amount: { type: GT.NonNull(SatAmount), description: "Amount in satoshis." },
    memo: { type: Memo, description: "Optional memo for the lightning invoice." },
    descriptionHash: { type: Hex32Bytes },
    callback: {
      type: Callback,
      description: "Optional callback for the lightning invoice updates.",
    },
  }),
})

const LnInvoiceCreateOnBehalfOfRecipientMutation = GT.Field({
  type: GT.NonNull(LnInvoicePayload),
  description: dedent`Returns a lightning invoice for an associated wallet.
  When invoice is paid the value will be credited to a BTC wallet.
  Expires after 24 hours.`,
  args: {
    input: { type: GT.NonNull(LnInvoiceCreateOnBehalfOfRecipientInput) },
  },
  resolve: async (_, args) => {
    const { recipientWalletId, amount, memo, descriptionHash, callback } = args.input
    for (const input of [recipientWalletId, amount, memo, descriptionHash, callback]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const btcWalletValidated = await validateIsBtcWalletForMutation(recipientWalletId)
    if (btcWalletValidated != true) return btcWalletValidated

    const invoice = await Wallets.addInvoiceForRecipient({
      recipientWalletId,
      amount,
      memo,
      descriptionHash,
      callback,
    })

    if (invoice instanceof Error) {
      const appErr = mapError(invoice)
      return { errors: [{ message: appErr.message || appErr.name }] } // TODO: refine error
    }

    return {
      errors: [],
      invoice,
    }
  },
})

export default LnInvoiceCreateOnBehalfOfRecipientMutation
