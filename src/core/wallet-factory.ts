import { getUserWalletConfig } from "@config/app"

import { User } from "@services/mongoose/schema"

import { LightningUserWallet } from "./lightning/wallet"
import { UserWallet } from "./user-wallet"
import { Prices } from "@app"

export const WalletFactory = async ({
  user,
  logger,
}: {
  user: typeof User
  logger: Logger
}) => {
  // FIXME: update price on event outside of the wallet factory
  const lastPrice = await Prices.getCurrentPrice()
  if (lastPrice instanceof Error) throw lastPrice
  UserWallet.setCurrentPrice(lastPrice)

  const userWalletConfig = getUserWalletConfig(user)

  return new LightningUserWallet({ user, logger, config: userWalletConfig })
}

export const getWalletFromRole = async ({ logger, role }) => {
  const user = await User.findOne({ role })
  return WalletFactory({ user, logger })
}
