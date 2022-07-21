/**
 * how to run:
 * yarn ts-node --files -r tsconfig-paths/register src/debug/create-usd-wallets.ts
 */

import { addWalletIfNonexistent } from "@app/accounts"
import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"
import { isUp } from "@services/lnd/health"
import { params as unauthParams } from "@services/lnd/unauth"
import { setupMongoConnection } from "@services/mongodb"
import { AccountsRepository } from "@services/mongoose"

const createUsdWallets = async () => {
  await setupMongoConnection()

  const accounts = await AccountsRepository().listUnlockedAccounts()
  if (accounts instanceof Error) return accounts

  for (const account of accounts) {
    await addWalletIfNonexistent({
      accountId: account.id,
      type: WalletType.Checking,
      currency: WalletCurrency.Usd,
    })
  }

  console.log("completed")
}

const main = async () => {
  return createUsdWallets()
}

setupMongoConnection()
  .then(async (mongoose) => {
    await Promise.all(unauthParams.map((lndParams) => isUp(lndParams)))
    await main()
    return mongoose.connection.close()
  })
  .catch((err) => console.log(err))
