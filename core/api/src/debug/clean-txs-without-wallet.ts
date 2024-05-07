/**
 * how to run:
 *
 * pnpm tsx src/debug/clean-txs-without-wallet.ts <paymentHash>
 *
 * <paymentHash>: invoice payment hash.
 */

import { setupMongoConnection } from "@/services/mongodb"
import { WalletInvoice } from "@/services/mongoose/schema"
import { WalletInvoicesRepository } from "@/services/mongoose"

const defaultId = "00000000-0000-1000-a000-000000000000"

const cleanInvoice = async ({ paymentHash }: { paymentHash: PaymentHash }) => {
  const walletInvoice = await WalletInvoicesRepository().findByPaymentHash(paymentHash)
  if (walletInvoice instanceof Error) return walletInvoice

  console.log("Invoice to update", walletInvoice)

  if (walletInvoice.recipientWalletDescriptor.id) {
    return new Error("Invoice with a valid walletId can't be cleaned")
  }

  // WalletInvoicesRepository does not have update method
  // and we dont want to include it in the interface
  const result = await WalletInvoice.updateOne(
    { _id: paymentHash },
    { accountId: defaultId, walletId: defaultId },
  )
  if (result.acknowledged && result.modifiedCount > 0) {
    return result.modifiedCount
  }

  return 0
}

const main = async () => {
  const args = process.argv.slice(-1)
  const params = {
    paymentHash: args[0] as PaymentHash,
  }
  const result = await cleanInvoice(params)
  if (result instanceof Error) {
    console.error("Error:", result)
    return
  }
  console.log(`Invoice ${params.paymentHash} cleaned updating ${result} records`)
}

setupMongoConnection()
  .then(async (mongoose) => {
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
