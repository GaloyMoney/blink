import { Wallets } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { GT } from "@graphql/index"

import LnInvoicePayload from "@graphql/types/payload/ln-invoice"
import Memo from "@graphql/types/scalar/memo"
import Hex32Bytes from "@graphql/types/scalar/hex32bytes"
import SatAmount from "@graphql/types/scalar/sat-amount"
import WalletId from "@graphql/types/scalar/wallet-id"
import { validateIsBtcWalletForMutation } from "@graphql/helpers"
import dedent from "dedent"

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
  }),
})

const LnInvoiceCreateOnBehalfOfRecipientMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(LnInvoicePayload),
  description: dedent`Returns a lightning invoice for an associated wallet.
  When invoice is paid the value will be credited to a BTC wallet.
  Expires after 24 hours.`,
  args: {
    input: { type: GT.NonNull(LnInvoiceCreateOnBehalfOfRecipientInput) },
  },
  resolve: async (_, args) => {
    const { recipientWalletId, amount, memo, descriptionHash } = args.input
    for (const input of [recipientWalletId, amount, memo, descriptionHash]) {
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
    })

    if (invoice instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(invoice)] }
    }

    return {
      errors: [],
      invoice,
    }
  },
})

export default LnInvoiceCreateOnBehalfOfRecipientMutation
