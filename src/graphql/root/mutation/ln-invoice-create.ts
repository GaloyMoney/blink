import { GT } from "@graphql/index"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmount from "@graphql/types/scalar/sat-amount"
import LnInvoicePayload from "@graphql/types/payload/ln-invoice"
import { validateIsBtcWalletForMutation } from "@graphql/helpers"
import { Wallets } from "@app"
import dedent from "dedent"

const LnInvoiceCreateInput = GT.Input({
  name: "LnInvoiceCreateInput",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
      description: "Wallet ID for a BTC wallet belonging to the current account.",
    },
    amount: { type: GT.NonNull(SatAmount), description: "Amount in satoshis." },
    memo: { type: Memo, description: "Optional memo for the lightning invoice." },
  }),
})

const LnInvoiceCreateMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(LnInvoicePayload),
  description: dedent`Returns a lightning invoice for an associated wallet.
  When invoice is paid the value will be credited to a BTC wallet.
  Expires after 24 hours.`,
  args: {
    input: { type: GT.NonNull(LnInvoiceCreateInput) },
  },
  resolve: async (_, args) => {
    const { walletId, memo, amount } = args.input

    for (const input of [walletId, memo, amount]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const btcWalletValidated = await validateIsBtcWalletForMutation(walletId)
    if (btcWalletValidated != true) return btcWalletValidated

    const lnInvoice = await Wallets.addInvoiceForSelf({
      walletId,
      amount,
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

export default LnInvoiceCreateMutation
