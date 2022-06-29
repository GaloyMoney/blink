import { sendDefaultWalletBalanceToUsers } from "@app/accounts/send-default-wallet-balance-to-users"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"

const main = async () => {
  const mongoose = await setupMongoConnection()

  // We're not using the Accounts.sendDefaultWalletBalanceToUsers() call pattern
  // because the root span becomes much too large. By calling the function directly
  // we bypass the wrapper.
  await sendDefaultWalletBalanceToUsers()

  await mongoose.connection.close()
}

if (require.main === module) {
  try {
    main()
  } catch (err) {
    baseLogger.warn({ err }, "error in the dailyBalanceNotification job")
  }
}
