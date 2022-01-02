import { getUserWalletConfig } from "@config/app"

import { User } from "@services/mongoose/schema"

import { Prices } from "@app"

import { LightningUserWallet } from "./lightning/wallet"
import { UserWallet } from "./user-wallet"

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
