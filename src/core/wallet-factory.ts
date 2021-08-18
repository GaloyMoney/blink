import { getUserWalletConfig } from "@config/app"

import { getCurrentPrice } from "@services/realtime-price"
import { User } from "@services/mongoose/schema"

import { NotFoundError } from "./error"
import { LightningUserWallet } from "./lightning/wallet"
import { UserWallet } from "./user-wallet"
import { UsersRepository } from "@services/mongoose"

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

  const userWalletConfig = getUserWalletConfig(user)

  return new LightningUserWallet({ user, logger, config: userWalletConfig })
}

export const getWalletFromUsername = async ({
  username,
  logger,
}: {
  username: string
  logger: Logger
}) => {
  const usersRepo = UsersRepository()
  const user = await usersRepo.findByUsername(username as Username)
  if (user instanceof Error) throw user

  return WalletFactory({ user, logger })
}

export const getWalletFromRole = async ({ logger, role }) => {
  const user = await User.findOne({ role })
  return WalletFactory({ user, logger })
}
