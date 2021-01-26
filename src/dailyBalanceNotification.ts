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

  const users = await User.find({})
  for (const user of users) {
    const userWallet = await WalletFactory({ user, uid: user._id, currency: user.currency, logger })
    if (await userWallet.isUserActive()) {
      await userWallet.sendBalance()
    }
    else {
      logger.info({ uid: user._id }, 'not sending daily balance notification to inactive user')
    }
  }
}

if (require.main === module) {
  setupMongoConnection().then(main).catch((err) => logger.error(err))
}
