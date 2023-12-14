/**
 * how to run:
 *	. ./.envrc && yarn ts-node \
 *		--files \
 *			-r tsconfig-paths/register \
 *			-r src/services/tracing.ts \
 *		src/debug/add-payment-request-all-wallet-invoices.ts
 */

import { LndService } from "@/services/lnd"
import { lndsConnect } from "@/services/lnd/auth"
import { isUp } from "@/services/lnd/health"
import { setupMongoConnection } from "@/services/mongodb"
import {
  SemanticAttributes,
  addEventToCurrentSpan,
  asyncRunInSpan,
  wrapAsyncToRunInSpan,
} from "@/services/tracing"
import { WalletInvoice } from "@/services/mongoose/schema"

const main = async () => {
  return asyncRunInSpan(
    "debug.addPaymentRequestAllWalletInvoices",
    {
      attributes: {
        [SemanticAttributes.CODE_FUNCTION]: "addPaymentRequestAllWalletInvoices",
        [SemanticAttributes.CODE_NAMESPACE]: "debug",
      },
    },
    async () => {
      const initialNumberOfLnInvoicesMissingPaymentRequest =
        await WalletInvoice.countDocuments({
          paymentRequest: { $exists: false },
        })

      console.log(
        `Number of wallet invoices missing payment request: ${initialNumberOfLnInvoicesMissingPaymentRequest}`,
      )

      const lndService = LndService()
      if (lndService instanceof Error) return lndService
      const pubkeys = lndService.listActivePubkeys()
      for (const pubkey of pubkeys) {
        console.log(`Adding payment requests for pubkey: ${pubkey}`)
        await addPaymentRequestAllWalletInvoicesForPubkey({
          pubkey,
        })
        console.log(`Finished adding payment requests for pubkey: ${pubkey}`)
      }

      const finalNumberOfLnInvoicesMissingPaymentRequest =
        await WalletInvoice.countDocuments({
          paymentRequest: { $exists: false },
        })
      console.log(
        `Number of wallet invoices missing payment request: ${finalNumberOfLnInvoicesMissingPaymentRequest}`,
      )
      console.log(
        `Number of invoices that were modified: ${
          initialNumberOfLnInvoicesMissingPaymentRequest -
          finalNumberOfLnInvoicesMissingPaymentRequest
        }`,
      )
    },
  )
}

const addPaymentRequestAllWalletInvoicesForPubkey = wrapAsyncToRunInSpan({
  fnName: "addPaymentRequestAllWalletInvoicesForPubkey",
  namespace: "debug",
  fn: async ({ pubkey }: { pubkey: Pubkey }) => {
    const lndService = LndService()
    if (lndService instanceof Error) return lndService

    const invoices = lndService.listInvoices({ pubkey })

    if (invoices instanceof Error) return invoices

    let processedInvoiceCount = 0

    for await (const invoice of invoices) {
      const {
        paymentHash,
        lnInvoice: { paymentRequest },
      } = invoice

      await updateWalletInvoiceWithPaymentRequest({
        paymentHash,
        paymentRequest,
      })

      processedInvoiceCount++
      if (processedInvoiceCount % 100 === 0) {
        console.log(`Processed ${processedInvoiceCount} invoices`)
      }
    }
  },
})

const updateWalletInvoiceWithPaymentRequest = wrapAsyncToRunInSpan({
  fnName: "updateWalletInvoiceWithPaymentRequest",
  namespace: "debug",
  fn: async ({
    paymentHash,
    paymentRequest,
  }: {
    paymentHash: PaymentHash
    paymentRequest?: EncodedPaymentRequest
  }): Promise<boolean> => {
    if (!paymentRequest) {
      addEventToCurrentSpan(`No payment request for ${paymentHash}`)
      return false
    }

    const res = await WalletInvoice.updateOne(
      {
        _id: paymentHash,
      },
      {
        $set: {
          paymentRequest,
        },
      },
    )

    if (res.matchedCount !== 1) {
      addEventToCurrentSpan(
        `Wallet invoice with payment hash: "${paymentHash}" does not exist`,
      )
      return false
    }

    return true
  },
})

setupMongoConnection(false)
  .then(async (mongoose) => {
    await Promise.all(lndsConnect.map((lndParams) => isUp(lndParams)))
    await main()
    if (mongoose) await mongoose.connection.close()
    console.log("Done!")
  })
  .catch((err) => console.log(err))
