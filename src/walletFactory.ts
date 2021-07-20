import { TransactionLimits, yamlConfig } from "./config"
import { getUserWalletConfig, yamlConfig } from "./config"
import { NotFoundError } from "./error"
import { LightningUserWallet } from "./LightningUserWallet"
import { getCurrentPrice } from "./realtimePrice"
import { User } from "./schema"
import { Logger } from "./types"
import { UserWallet } from "./userWallet"

export const WalletFactory = async ({
  user,
  logger,
}: {
  user: typeof User
  logger: Logger
}) => {
  // FIXME: update price on event outside of the wallet factory
  const lastPrice = await getCurrentPrice()
  UserWallet.setCurrentPrice(lastPrice)

<<<<<<< HEAD
  const transactionLimits = new TransactionLimits({
    level: user.level,
  })

  const userWalletConfig: UserWalletConfig = {
    name: yamlConfig.name,
    dustThreshold: yamlConfig.onChainWallet.dustThreshold,
    limits: transactionLimits,
  }
=======
  if (user?.role === "dealer") {
    return new FtxDealerWallet({ user, logger })
  }

  const userWalletConfig = getUserWalletConfig(user)
>>>>>>> 47429139 (Move userWalletConfig into a getter function)

  return new LightningUserWallet({ user, logger, config: userWalletConfig })
}

export const WalletFromUsername = async ({
  username,
  logger,
}: {
  username: string
  logger: Logger
}) => {
  const user = await User.getUserByUsername(username)
  if (!user) {
    const error = `User not found`
    throw new NotFoundError(error, { logger })
  }

  return WalletFactory({ user, logger })
}

export const getFunderWallet = async ({ logger }) => {
  const funder = await User.findOne({ username: yamlConfig.funder })
  return WalletFactory({ user: funder, logger })
}
