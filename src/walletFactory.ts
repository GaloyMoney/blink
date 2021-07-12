import { TransactionLimits, yamlConfig } from "./config"
import { FtxDealerWallet } from "./dealer/FtxDealerWallet"
import { NotFoundError } from "./error"
import { LightningUserWallet } from "./LightningUserWallet"
import { getCurrentPrice } from "./realtimePrice"
import { User } from "./schema"
import { Logger, UserWalletConfig } from "./types"
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

  if (user?.role === "dealer") {
    return new FtxDealerWallet({ user, logger })
  }

  const transactionLimits = new TransactionLimits({
    config: yamlConfig.limits,
    level: user.level,
  })

  const userWalletConfig: UserWalletConfig = {
    name: yamlConfig.name,
    dustThreshold: yamlConfig.onChainWallet.dustThreshold,
    limits: transactionLimits,
  }

  return new LightningUserWallet({ user, logger, config: userWalletConfig })
}

export const WalletFromUsername = async ({
  username,
  logger,
}: {
  username: string
  logger: Logger
}) => {
  const user = await User.findByUsername({ username })
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

export const getDealerWallet = async ({ logger }) => {
  const dealer = await User.findOne({ role: "dealer" })
  return WalletFactory({ user: dealer, logger })
}
