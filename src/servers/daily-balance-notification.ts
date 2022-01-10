import { Accounts } from "@app"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"

const main = async () => {
  const logger = baseLogger.child({ module: "dailyBalanceNotification" })
  const mongoose = await setupMongoConnection()
  await Accounts.sendDefaultWalletBalanceToUsers(logger)

  await mongoose.connection.close()
}

if (require.main === module) {
  try {
    main()
  } catch (err) {
    baseLogger.warn({ err }, "error in the dailyBalanceNotification job")
  }
}
