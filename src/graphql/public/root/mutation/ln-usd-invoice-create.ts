import dedent from "dedent"

// import { Wallets } from "@app"

import { GT } from "@graphql/index"
import Memo from "@graphql/shared/types/scalar/memo"
import Minutes from "@graphql/public/types/scalar/minutes"
import WalletId from "@graphql/shared/types/scalar/wallet-id"
import CentAmount from "@graphql/public/types/scalar/cent-amount"
import LnInvoicePayload from "@graphql/public/types/payload/ln-invoice"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"

// FLASH FORK: import ibex dependencies
import { decodeInvoice } from "@domain/bitcoin/lightning"

import Ibex from "@services/ibex"
import { IbexEventError, UnexpectedResponseError } from "@services/ibex/errors"

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

    // FLASH FORK: create IBEX invoice instead of Galoy invoice
    const resp = await Ibex.addInvoice({
      amount: amount / 100,
      accountId: walletId,
      memo,
      expiration: expiresIn,
      // webhookUrl: "http://development.flashapp.me:4002/ibex-endpoint", // TODO: get from env
      // webhookSecret: "secret",
    })

    if (resp instanceof IbexEventError) {
      return { errors: [mapAndParseErrorForGqlResponse(resp)] }
    }

    const invoiceString: string | undefined = resp.invoice?.bolt11
    if (!invoiceString) {
      return { errors: [mapAndParseErrorForGqlResponse(new UnexpectedResponseError("Could not find invoice."))] }
    }
    const decodedInvoice = decodeInvoice(invoiceString)
    if (decodedInvoice instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(decodedInvoice)] }
    }
    
    return {
      errors: [],
      invoice: {
        destination: decodedInvoice.destination,
        paymentHash: decodedInvoice.paymentHash,
        paymentRequest: decodedInvoice.paymentRequest,
        paymentSecret: decodedInvoice.paymentSecret,
        milliSatsAmount: decodedInvoice.milliSatsAmount,
        description: decodedInvoice.description,
        cltvDelta: decodedInvoice.cltvDelta,
        amount: null,
        paymentAmount: null,
        routeHints: decodedInvoice.routeHints,
        features: decodedInvoice.features,
        expiresAt: decodedInvoice.expiresAt,
        isExpired: decodedInvoice.isExpired,
      },
    }
  },
})

export default LnUsdInvoiceCreateMutation
