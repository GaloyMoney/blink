import { getUserWalletConfig } from "@config/app"

import { getCurrentPrice } from "@services/realtime-price"
import { User } from "@services/mongoose/schema"

import { NotFoundError } from "./error"
import { LightningUserWallet } from "./lightning/wallet"
import { UserWallet } from "./user-wallet"
import { CSVAccountExport } from "./csv-account-export"
import { accountPath } from "@services/ledger/accounts"

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
  const user = await User.getUserByUsername(username)
  if (!user) {
    const error = `User not found`
    throw new NotFoundError(error, { logger })
  }

  return WalletFactory({ user, logger })
}

export const getWalletFromRole = async ({ logger, role }) => {
  const user = await User.findOne({ role })
  return WalletFactory({ user, logger })
}

export const getStringCsvForWallets = async (walletIds: WalletId[]) => {
  const csv = new CSVAccountExport()
  for (const walletId of walletIds) {
    await csv.addAccount({ account: accountPath(walletId) })
  }
  return csv.getBase64()
}
