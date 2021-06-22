import { setupMongoConnection } from "../mongodb"
import { User } from "../schema"
import { baseLogger } from "../logger"
import { WalletFactory } from "../walletFactory"

const logger = baseLogger.child({ module: "dailyBalanceNotification" })

const main = async () => {
  const mongoose = await setupMongoConnection()
  await sendBalanceToUsers()

  await mongoose.connection.close()
  // FIXME: we need to exit because we may have some pending promise
  process.exit(0)
}

export const sendBalanceToUsers = async () => {
  const users = await User.getActiveUsers({})

  for (const user of users) {
    const userWallet = await WalletFactory({ user, logger })
    await userWallet.sendBalance()
  }
}

if (require.main === module) {
  try {
    main()
  } catch (err) {
    baseLogger.warn({ err }, "error in the dailyBalanceNotification job")
  }
}
