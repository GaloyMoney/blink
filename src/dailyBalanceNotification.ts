import { setupMongoConnection, User } from "./mongodb"
import { sendNotification } from "./notification"
import { baseLogger } from "./utils"
import { WalletFactory } from "./walletFactory"

const logger = baseLogger.child({ module: "dailyBalanceNotification" })

const sendBalanceToUser = async () => {
  let userWallet

  for await (const user of User.find({})) {
    userWallet = await WalletFactory({ user, uid: user._id, currency: user.currency, logger })
    const balance = await userWallet.getBalance()
    logger.info("sending balance notification to user %o", user._id)
    await sendNotification({uid: user._id, title: "Your balance",logger})
  }
}

setupMongoConnection().then(sendBalanceToUser).catch((err) => logger.error(err))