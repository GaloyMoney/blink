import { getUserWalletConfig } from "@config"

import { User } from "@services/mongoose/schema"

import { Prices } from "@app"

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

  return new UserWallet({ user, logger, config: userWalletConfig })
}
