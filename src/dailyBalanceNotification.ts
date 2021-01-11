import { setupMongoConnection, User } from "./mongodb"
import { sendNotification } from "./notification"
import { baseLogger } from "./utils"
import { WalletFactory } from "./walletFactory"

const logger = baseLogger.child({ module: "dailyBalanceNotification" })

export const sendBalanceToUser = async () => {

  const users = await User.find({})
  for (const user of users) {
    const userWallet = await WalletFactory({ user, uid: user._id, currency: user.currency, logger })
    if (await userWallet.isUserActive(user._id)) {
      const balanceUsd = await userWallet.getBalanceUsd()
      logger.info("sending balance notification to user %o", user._id)
      await sendNotification({ uid: user._id, title: "Balance today", logger, body: `Your balance is \$${balanceUsd}` })
    }
  }
}

if (require.main === module) {
  setupMongoConnection().then(sendBalanceToUser).catch((err) => logger.error(err))
}
