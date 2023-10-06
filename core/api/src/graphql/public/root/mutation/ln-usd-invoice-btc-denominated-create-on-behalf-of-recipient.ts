import dedent from "dedent"

import { Wallets } from "@/app"

import { GT } from "@/graphql/index"
import Memo from "@/graphql/shared/types/scalar/memo"
import Minutes from "@/graphql/public/types/scalar/minutes"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import Hex32Bytes from "@/graphql/public/types/scalar/hex32bytes"
import SatAmount from "@/graphql/shared/types/scalar/sat-amount"
import LnInvoicePayload from "@/graphql/public/types/payload/ln-invoice"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"

const LnUsdInvoiceBtcDenominatedCreateOnBehalfOfRecipientInput = GT.Input({
  name: "LnUsdInvoiceBtcDenominatedCreateOnBehalfOfRecipientInput",
  fields: () => ({
    recipientWalletId: {
      type: GT.NonNull(WalletId),
      description: "Wallet ID for a USD wallet which belongs to the account of any user.",
    },
    amount: { type: GT.NonNull(SatAmount), description: "Amount in satoshis." },
    memo: {
      type: Memo,
      description:
        "Optional memo for the lightning invoice. Acts as a note to the recipient.",
    },
    descriptionHash: { type: Hex32Bytes },
    expiresIn: {
      type: Minutes,
      description: "Optional invoice expiration time in minutes.",
    },
  }),
})

const LnUsdInvoiceBtcDenominatedCreateOnBehalfOfRecipientMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(LnInvoicePayload),
  description: dedent`Returns a lightning invoice denominated in satoshis for an associated wallet.
  When invoice is paid the equivalent value at invoice creation will be credited to a USD wallet.
  Expires after 'expiresIn' or 5 minutes (short expiry time because there is a USD/BTC exchange rate
    associated with the amount).`,
  args: {
    input: {
      type: GT.NonNull(LnUsdInvoiceBtcDenominatedCreateOnBehalfOfRecipientInput),
    },
  },
  resolve: async (_, args) => {
    const { recipientWalletId, amount, memo, descriptionHash, expiresIn } = args.input
    for (const input of [recipientWalletId, amount, memo, descriptionHash, expiresIn]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const invoice = await Wallets.addInvoiceForRecipientForUsdWalletAndBtcAmount({
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

export default LnUsdInvoiceBtcDenominatedCreateOnBehalfOfRecipientMutation
