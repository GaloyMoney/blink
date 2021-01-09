import { setupMongoConnection, User } from "./mongodb"
import { sendNotification } from "./notification"
import { baseLogger, isUserActive } from "./utils"
import { WalletFactory } from "./walletFactory"

const logger = baseLogger.child({ module: "dailyBalanceNotification" })

export const sendBalanceToUser = async () => {
  let userWallet

  for await (const user of User.find({})) {
    if (await isUserActive(user._id)) {
      userWallet = await WalletFactory({ user, uid: user._id, currency: user.currency, logger })
      const balanceUsd = userWallet.satsToUsd(await userWallet.getBalance())
      logger.info("sending balance notification to user %o", user._id)
      await sendNotification({ uid: user._id, title: "Balance today", logger, body: `Your balance is \$${balanceUsd}` })
    }
  }
}

setupMongoConnection().then(sendBalanceToUser).catch((err) => logger.error(err))