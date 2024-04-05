import dedent from "dedent"

import { Wallets } from "@/app"

import { GT } from "@/graphql/index"
import Memo from "@/graphql/shared/types/scalar/memo"
import Minutes from "@/graphql/public/types/scalar/minutes"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import SatAmount from "@/graphql/shared/types/scalar/sat-amount"
import Hex32Bytes from "@/graphql/public/types/scalar/hex32bytes"
import LnInvoicePayload from "@/graphql/public/types/payload/ln-invoice"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"

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
    expiresIn: {
      type: Minutes,
      description: "Optional invoice expiration time in minutes.",
    },
  }),
})

const LnInvoiceCreateOnBehalfOfRecipientMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(LnInvoicePayload),
  description: dedent`Returns a lightning invoice for an associated wallet.
  When invoice is paid the value will be credited to a BTC wallet.
  Expires after 'expiresIn' or 24 hours.`,
  args: {
    input: { type: GT.NonNull(LnInvoiceCreateOnBehalfOfRecipientInput) },
  },
  resolve: async (_, args) => {
    const { recipientWalletId, amount, memo, descriptionHash, expiresIn } = args.input
    for (const input of [recipientWalletId, amount, memo, descriptionHash, expiresIn]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const invoice = await Wallets.addInvoiceForRecipientForBtcWallet({
      recipientWalletId,
      amount,
      memo,
      descriptionHash,
      expiresIn,
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
