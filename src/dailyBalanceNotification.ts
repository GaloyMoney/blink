import { setupMongoConnection, User } from "./mongodb"
import { sendNotification } from "./notification"
import { baseLogger } from "./utils"
import { WalletFactory } from "./walletFactory"

const logger = baseLogger.child({ module: "dailyBalanceNotification" })

export const sendBalanceToUser = async () => {

  const users = await User.find({})
  for (const user of users) {
    const userWallet = await WalletFactory({ user, uid: user._id, currency: user.currency, logger })
    await userWallet.sendBalance()
  }
}

if (require.main === module) {
  setupMongoConnection().then(sendBalanceToUser).catch((err) => logger.error(err))
}
