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

const cleanInvoice = async ({ paymentHash }: { paymentHash: PaymentHash }) => {
  const walletInvoice = await WalletInvoicesRepository().findByPaymentHash(paymentHash)
  if (walletInvoice instanceof Error) return walletInvoice

  console.log("Invoice to delete", walletInvoice)

  if (walletInvoice.recipientWalletDescriptor.id) {
    return new Error("Invoice with a valid walletId can't be cleaned")
  }

  // WalletInvoicesRepository does not have delete method
  // and we dont want to include it in the interface
  const result = await WalletInvoice.deleteOne({ _id: paymentHash })
  if (result.acknowledged && result.deletedCount > 0) {
    return result.deletedCount
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
  console.log(`Invoice ${params.paymentHash} cleaned deleting ${result} records`)
}

setupMongoConnection()
  .then(async (mongoose) => {
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
