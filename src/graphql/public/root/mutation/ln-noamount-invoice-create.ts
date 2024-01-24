import dedent from "dedent"
import { GT } from "@graphql/index"
import Memo from "@graphql/shared/types/scalar/memo"
import Minutes from "@graphql/public/types/scalar/minutes"
import WalletId from "@graphql/shared/types/scalar/wallet-id"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import LnNoAmountInvoicePayload from "@graphql/public/types/payload/ln-noamount-invoice"

// FLASH FORK: import ibex dependencies
import { decodeInvoice } from "@domain/bitcoin/lightning"
import Ibex from "@services/ibex"
import { IbexEventError, UnexpectedResponseError } from "@services/ibex/errors"

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

    // FLASH FORK: create IBEX invoice instead of Galoy invoice

    // TODO: move this into Wallets.addInvoiceNoAmountForSelf
    const resp = await Ibex.addInvoice({
      amount: 0,
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

export default LnNoAmountInvoiceCreateMutation
