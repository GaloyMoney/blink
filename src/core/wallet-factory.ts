import { getUserWalletConfig } from "@config/app"

import { User } from "@services/mongoose/schema"

import { LightningUserWallet } from "./lightning/wallet"
import { UserWallet } from "./user-wallet"
import { getCurrentPrice } from "@app/prices"

export const WalletFactory = async ({
  user,
  logger,
}: {
  user: typeof User
  logger: Logger
}) => {
  // FIXME: update price on event outside of the wallet factory
  const lastPrice = await getCurrentPrice()
  if (lastPrice instanceof Error) throw lastPrice
  UserWallet.setCurrentPrice(lastPrice)

  const userWalletConfig = getUserWalletConfig(user)

  return new LightningUserWallet({ user, logger, config: userWalletConfig })
}
