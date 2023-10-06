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
import bolt11 from "bolt11"
import { toSats } from "@domain/bitcoin"
import { checkedToPubkey } from "@domain/bitcoin/lightning"
import { InputValidationError } from "@graphql/error"

import { IbexRoutes } from "../../../../services/IbexHelper/Routes"

import { requestIBexPlugin } from "../../../../services/IbexHelper/IbexHelper"

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
    //
    // const lnInvoice = await Wallets.addInvoiceForSelfForUsdWallet({
    //   walletId,
    //   amount,
    //   memo,
    //   expiresIn,
    // })

    let lnInvoice: LnInvoice
    const CreateLightningInvoice = await requestIBexPlugin(
      "POST",
      IbexRoutes.LightningInvoice,
      {},
      {
        amount,
        accountId: walletId,
        memo,
        expiration: expiresIn,
      },
    )
    const DecodeLightningInvoice = await requestIBexPlugin(
      "GET",
      IbexRoutes.LightningInvoice,
      {},
      {
        invoice: CreateLightningInvoice.data?.["data"]?.["invoice"]?.["bolt11"],
      },
    )
    console.log(
      "CreateLightningInvoice from IBEX",
      JSON.stringify(CreateLightningInvoice, null, 2),
    )

    if (
      CreateLightningInvoice &&
      CreateLightningInvoice.data &&
      CreateLightningInvoice.data["data"]["invoice"] &&
      DecodeLightningInvoice &&
      DecodeLightningInvoice.data &&
      DecodeLightningInvoice.data["data"]["paymentSecret"]
    ) {
      const invoiceString = CreateLightningInvoice.data["data"]["invoice"]["bolt11"]
      const decodedInvoice = bolt11.decode(invoiceString)
      const pubKey = checkedToPubkey(decodedInvoice.payeeNodeKey || "")
      const paymentSecret = DecodeLightningInvoice.data["data"]["paymentSecret"]
      const cltvDelta = DecodeLightningInvoice.data["data"]["minFinalCLTVExpiry"]
      if (pubKey instanceof Error) {
        return new InputValidationError({ message: "Invalid value for LnPubkey" })
      } else {
        lnInvoice = {
          destination: pubKey,
          paymentHash: CreateLightningInvoice.data["data"]["invoice"]["paymentHash"],
          paymentRequest: CreateLightningInvoice.data["data"]["invoice"]["bolt11"],
          paymentSecret,
          milliSatsAmount: CreateLightningInvoice.data["data"]["invoice"]["amountMsat"],
          description: CreateLightningInvoice.data["data"]["invoice"]["memo"],
          cltvDelta,
          amount: toSats(CreateLightningInvoice.data["data"]["amount"] / 1000),
          paymentAmount: null,
          routeHints: [],
          features: [],
          expiresAt: CreateLightningInvoice.data["data"]["invoice"]["expiryDateUtc"],
          isExpired:
            CreateLightningInvoice.data["data"]["invoice"]["state"]["id"] == 2
              ? true
              : false,
        }
        if (lnInvoice instanceof Error) {
          return { errors: [mapAndParseErrorForGqlResponse(lnInvoice)] }
        }

        return {
          errors: [],
          invoice: lnInvoice,
        }
      }
    }
  },
})

export default LnUsdInvoiceCreateMutation
