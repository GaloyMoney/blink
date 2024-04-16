import dedent from "dedent"

import { Wallets } from "@/app"

import { GT } from "@/graphql/index"
import Memo from "@/graphql/shared/types/scalar/memo"
import Minutes from "@/graphql/public/types/scalar/minutes"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import SatAmount from "@/graphql/shared/types/scalar/sat-amount"
import TxExternalId from "@/graphql/shared/types/scalar/tx-external-id"
import LnInvoicePayload from "@/graphql/public/types/payload/ln-invoice"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"

const LnInvoiceCreateInput = GT.Input({
  name: "LnInvoiceCreateInput",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
      description: "Wallet ID for a BTC wallet belonging to the current account.",
    },
    amount: { type: GT.NonNull(SatAmount), description: "Amount in satoshis." },
    memo: { type: Memo, description: "Optional memo for the lightning invoice." },
    expiresIn: {
      type: Minutes,
      description: "Optional invoice expiration time in minutes.",
    },
    externalId: { type: TxExternalId },
  }),
})

const LnInvoiceCreateMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(LnInvoicePayload),
  description: dedent`Returns a lightning invoice for an associated wallet.
  When invoice is paid the value will be credited to a BTC wallet.
  Expires after 'expiresIn' or 24 hours.`,
  args: {
    input: { type: GT.NonNull(LnInvoiceCreateInput) },
  },
  resolve: async (_, args) => {
    const { walletId, amount, memo, expiresIn, externalId } = args.input

    for (const input of [walletId, amount, memo, expiresIn, externalId]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
      walletId,
      amount,
      memo,
      expiresIn,
      externalId,
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

export default LnInvoiceCreateMutation
