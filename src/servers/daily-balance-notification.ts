import { getRecentlyActiveAccounts } from "@app/accounts/active-accounts"
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

  for (const account of accounts) {
    await NotificationsService(logger).sendBalance(account)
  }
}

if (require.main === module) {
  try {
    main()
  } catch (err) {
    baseLogger.warn({ err }, "error in the dailyBalanceNotification job")
  }
}
