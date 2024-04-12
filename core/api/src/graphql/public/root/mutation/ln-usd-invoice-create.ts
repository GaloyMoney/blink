import dedent from "dedent"

import { Wallets } from "@/app"

import { GT } from "@/graphql/index"
import Memo from "@/graphql/shared/types/scalar/memo"
import Minutes from "@/graphql/public/types/scalar/minutes"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import CentAmount from "@/graphql/public/types/scalar/cent-amount"
import LnInvoicePayload from "@/graphql/public/types/payload/ln-invoice"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"

const LnUsdInvoiceCreateInput = GT.Input({
  name: "LnUsdInvoiceCreateInput",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
      description: "Wallet ID for a USD wallet belonging to the current user.",
    },
    amount: { type: GT.NonNull(CentAmount), description: "Amount in USD cents." },
    memo: { type: Memo, description: "Optional memo for the lightning invoice." },
    expiresIn: {
      type: Minutes,
      description: "Optional invoice expiration time in minutes.",
    },
  }),
})

const LnUsdInvoiceCreateMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(LnInvoicePayload),
  description: dedent`Returns a lightning invoice denominated in satoshis for an associated wallet.
  When invoice is paid the equivalent value at invoice creation will be credited to a USD wallet.
  Expires after 'expiresIn' or 5 minutes (short expiry time because there is a USD/BTC exchange rate
  associated with the amount).`,
  args: {
    input: { type: GT.NonNull(LnUsdInvoiceCreateInput) },
  },
  resolve: async (_, args) => {
    const { walletId, amount, memo, expiresIn } = args.input

    for (const input of [walletId, amount, memo, expiresIn]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const invoice = await Wallets.addInvoiceForSelfForUsdWallet({
      walletId,
      amount,
      memo,
      expiresIn,
      externalId: undefined,
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

export default LnUsdInvoiceCreateMutation
