import { setupMongoConnection, User } from "./mongodb"
import { baseLogger } from "./utils"
import { WalletFactory } from "./walletFactory"

const logger = baseLogger.child({ module: "dailyBalanceNotification" })

const main = async () => {
  await sendBalanceToUsers()
  // FIXME: we probably needs to exit because we have a memleak of pending promise
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
  setupMongoConnection().then(main).catch((err) => logger.error(err))
}
