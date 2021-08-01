import { setupMongoConnection } from "@services/mongodb"
import { User } from "@services/mongoose/schema"
import { baseLogger } from "@services/logger"

import { WalletFactory } from "@core/wallet-factory"

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
