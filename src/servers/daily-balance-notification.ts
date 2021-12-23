import { getRecentlyActiveAccounts } from "@app/accounts/active-accounts"
import { getCurrentPrice } from "@app/prices"
import { getBalanceForWallet } from "@app/wallets"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"
import { NotificationsService } from "@services/notifications"

const logger = baseLogger.child({ module: "dailyBalanceNotification" })

const main = async () => {
  const mongoose = await setupMongoConnection()
  await sendBalanceToUsers()

  await mongoose.connection.close()
  // FIXME: we need to exit because we may have some pending promise
  process.exit(0)
}

export const sendBalanceToUsers = async () => {
  const accounts = await getRecentlyActiveAccounts()
  if (accounts instanceof Error) throw accounts

  const price = await getCurrentPrice()

  for (const account of accounts) {
    const balance = await getBalanceForWallet({
      walletId: account.defaultWalletId,
      logger,
    })
    if (balance instanceof Error) throw balance

    await NotificationsService(logger).sendBalance({
      balance,
      ownerId: account.ownerId,
      price,
    })
  }
}

if (require.main === module) {
  try {
    main()
  } catch (err) {
    baseLogger.warn({ err }, "error in the dailyBalanceNotification job")
  }
}
