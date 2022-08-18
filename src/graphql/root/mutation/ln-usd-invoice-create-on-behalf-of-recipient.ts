import dedent from "dedent"

import { Wallets } from "@app"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import Memo from "@graphql/types/scalar/memo"
import Callback from "@graphql/types/scalar/callback"
import WalletId from "@graphql/types/scalar/wallet-id"
import Hex32Bytes from "@graphql/types/scalar/hex32bytes"
import CentAmount from "@graphql/types/scalar/cent-amount"
import LnInvoicePayload from "@graphql/types/payload/ln-invoice"
import { validateIsUsdWalletForMutation } from "@graphql/helpers"

const LnUsdInvoiceCreateOnBehalfOfRecipientInput = GT.Input({
  name: "LnUsdInvoiceCreateOnBehalfOfRecipientInput",
  fields: () => ({
    recipientWalletId: {
      type: GT.NonNull(WalletId),
      description: "Wallet ID for a USD wallet which belongs to the account of any user.",
    },
    amount: { type: GT.NonNull(CentAmount), description: "Amount in USD cents." },
    memo: {
      type: Memo,
      description:
        "Optional memo for the lightning invoice. Acts as a note to the recipient.",
    },
    descriptionHash: { type: Hex32Bytes },
    callback: {
      type: Callback,
      description: "Optional callback for the lightning invoice updates.",
    },
  }),
})

const LnUsdInvoiceCreateOnBehalfOfRecipientMutation = GT.Field({
  type: GT.NonNull(LnInvoicePayload),
  description: dedent`Returns a lightning invoice denominated in satoshis for an associated wallet.
  When invoice is paid the equivalent value at invoice creation will be credited to a USD wallet.
  Expires after 5 minutes (short expiry time because there is a USD/BTC exchange rate
    associated with the amount).`,
  args: {
    input: { type: GT.NonNull(LnUsdInvoiceCreateOnBehalfOfRecipientInput) },
  },
  resolve: async (_, args) => {
    const { recipientWalletId, amount, memo, descriptionHash, callback } = args.input
    for (const input of [recipientWalletId, amount, memo, descriptionHash, callback]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const usdWalletValidated = await validateIsUsdWalletForMutation(recipientWalletId)
    if (usdWalletValidated != true) return usdWalletValidated

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

export default LnUsdInvoiceCreateOnBehalfOfRecipientMutation
