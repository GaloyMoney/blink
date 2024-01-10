/**
 * how to run:
 * yarn ts-node --files -r tsconfig-paths/register src/debug/create-usd-wallets.ts
 */

import { WalletCurrency } from "@/domain/shared"
import { WalletType } from "@/domain/wallets"
import { isUp } from "@/services/lnd/health"
import { lndsConnect } from "@/services/lnd/auth"
import { setupMongoConnection } from "@/services/mongodb"
import { AccountsRepository, WalletsRepository } from "@/services/mongoose"

const addWalletIfNonexistent = async ({
  accountId,
  type,
  currency,
}: {
  accountId: AccountId
  type: WalletType
  currency: WalletCurrency
}): Promise<Wallet | ApplicationError> => {
  const wallets = await WalletsRepository().listByAccountId(accountId)
  if (wallets instanceof Error) return wallets

  const walletOfTypeAndCurrency = wallets.find(
    (wallet) => wallet.currency === currency && wallet.type === type,
  )
  if (walletOfTypeAndCurrency) return walletOfTypeAndCurrency

  return WalletsRepository().persistNew({
    accountId,
    type,
    currency,
  })
}

const createUsdWallets = async () => {
  await setupMongoConnection()

  const accounts = AccountsRepository().listLockedAccounts()
  if (accounts instanceof Error) return accounts
  let progress = 0
  for await (const account of accounts) {
    await addWalletIfNonexistent({
      accountId: account.id,
      type: WalletType.Checking,
      currency: WalletCurrency.Usd,
    })
    progress++
    if (progress % 1000 === 0) {
      console.log(`${progress} accounts iterated`)
    }
  }

  console.log("completed")
}

const main = async () => {
  return createUsdWallets()
}

setupMongoConnection()
  .then(async (mongoose) => {
    await Promise.all(lndsConnect.map((lndParams) => isUp(lndParams)))
    await main()
    return mongoose.connection.close()
  })
  .catch((err) => console.log(err))
