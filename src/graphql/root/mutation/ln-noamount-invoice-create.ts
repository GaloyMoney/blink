import { Wallets } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { GT } from "@graphql/index"
import LnNoAmountInvoicePayload from "@graphql/types/payload/ln-noamount-invoice"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"
import dedent from "dedent"

const LnNoAmountInvoiceCreateInput = GT.Input({
  name: "LnNoAmountInvoiceCreateInput",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
      description:
        "ID for either a USD or BTC wallet belonging to the account of the current user.",
    },
    memo: { type: Memo, description: "Optional memo for the lightning invoice." },
  }),
})

const LnNoAmountInvoiceCreateMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(LnNoAmountInvoicePayload),
  description: dedent`Returns a lightning invoice for an associated wallet.
  Can be used to receive any supported currency value (currently USD or BTC).
  Expires after 24 hours.`,
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
      return { errors: [mapAndParseErrorForGqlResponse(lnInvoice)] }
    }

    return {
      errors: [],
      invoice: lnInvoice,
    }
  },
})

export default LnNoAmountInvoiceCreateMutation
