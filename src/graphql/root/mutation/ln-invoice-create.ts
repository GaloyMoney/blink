import dedent from "dedent"

import { Wallets } from "@app"

import { GT } from "@graphql/index"
import Memo from "@graphql/types/scalar/memo"
import { mapError } from "@graphql/error-map"
import Callback from "@graphql/types/scalar/callback"
import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmount from "@graphql/types/scalar/sat-amount"
import LnInvoicePayload from "@graphql/types/payload/ln-invoice"
import { validateIsBtcWalletForMutation } from "@graphql/helpers"

const LnInvoiceCreateInput = GT.Input({
  name: "LnInvoiceCreateInput",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
      description: "Wallet ID for a BTC wallet belonging to the current account.",
    },
    amount: { type: GT.NonNull(SatAmount), description: "Amount in satoshis." },
    memo: { type: Memo, description: "Optional memo for the lightning invoice." },
    callback: {
      type: Callback,
      description: "Optional callback for the lightning invoice updates.",
    },
  }),
})

const LnInvoiceCreateMutation = GT.Field({
  type: GT.NonNull(LnInvoicePayload),
  description: dedent`Returns a lightning invoice for an associated wallet.
  When invoice is paid the value will be credited to a BTC wallet.
  Expires after 24 hours.`,
  args: {
    input: { type: GT.NonNull(LnInvoiceCreateInput) },
  },
  resolve: async (_, args) => {
    const { walletId, memo, amount, callback } = args.input

    for (const input of [walletId, memo, amount, callback]) {
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

export default LnInvoiceCreateMutation
