/**
 * how to run:
 *
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/get-wallet-balance.ts <wallet id>
 *
 * <wallet id>: Wallet id. Must be the last param
 */
import { params as unauthParams } from "@services/lnd/unauth"
import { setupMongoConnection } from "@services/mongodb"
import { LedgerService } from "@services/ledger"
import { isUp } from "@services/lnd/health"

const getWalletBalance = async (walletId: WalletId) => {
  return LedgerService().getWalletBalance(walletId)
}

const main = async () => {
  const args = process.argv
  console.log("Start date:", new Date())
  const result = await getWalletBalance(args.at(-1) as WalletId)
  if (result instanceof Error) {
    console.error("Error:", result)
    return
  }
  console.log(`Wallet balance ${args.at(-1)}: `, result)
  console.log("End date:", new Date())
}

setupMongoConnection()
  .then(async (mongoose) => {
    await Promise.all(unauthParams.map((lndParams) => isUp(lndParams)))
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
