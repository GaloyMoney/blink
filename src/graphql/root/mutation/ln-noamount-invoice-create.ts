import dedent from "dedent"

import { Wallets } from "@app"

import { GT } from "@graphql/index"
import Memo from "@graphql/types/scalar/memo"
import Minutes from "@graphql/types/scalar/minutes"
import WalletId from "@graphql/types/scalar/wallet-id"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
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
    expiresIn: {
      type: Minutes,
      description: "Optional invoice expiration time in minutes.",
    },
  }),
})

const LnNoAmountInvoiceCreateMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(LnNoAmountInvoicePayload),
  description: dedent`Returns a lightning invoice for an associated wallet.
  Can be used to receive any supported currency value (currently USD or BTC).
  Expires after 'expiresIn' or 24 hours for BTC invoices or 5 minutes for USD invoices.`,
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoiceCreateInput) },
  },
  resolve: async (_, args) => {
    const { walletId, memo, expiresIn } = args.input

    for (const input of [walletId, memo, expiresIn]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
      walletId,
      memo,
      expiresIn,
    })

    if (lnInvoice instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(lnInvoice)] }
    }

    return {
      errors: [],
      invoice: lnInvoice,
    }
  },
})

export default LnNoAmountInvoiceCreateMutation
