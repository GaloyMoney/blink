import * as jwt from 'jsonwebtoken';
import { FtxDealerWallet } from "./dealer/FtxDealerWallet";
import { getCurrentPrice } from "./realtimePrice";
import { LightningUserWallet } from "./LightningUserWallet";
import { login } from "./text";
import { baseLogger, LoggedError } from "./utils";
import { UserWallet } from "./userWallet";
import { User } from "./schema";
import { yamlConfig } from "./config";


export const WalletFactory = async ({ user, logger }: { user: typeof User, logger: any }) => {
  // FIXME: update price on event outside of the wallet factory
  const lastPrice = await getCurrentPrice()
  UserWallet.setCurrentPrice(lastPrice)

  if (user?.role === "dealer") {
    return new FtxDealerWallet({ user, logger })
  }

  return new LightningUserWallet({ user, logger })
}

export const WalletFromUsername = async ({ username, logger }: { username: string, logger: any }) => {
  const user = await User.findByUsername({ username })
  if (!user) {
    const error = `User not found`
    logger.warn({username}, error)
    throw new LoggedError(error)
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

// utils function for test
export const getTokenFromPhoneIndex = async (index) => {
  const entry = yamlConfig.test_accounts[index]
  const raw_token = await login({ ...entry, logger: baseLogger })
  const token = jwt.verify(raw_token, process.env.JWT_SECRET);

  const { uid } = token

  if (entry.username) {
    await User.findOneAndUpdate({ _id: uid }, { username: entry.username })
  }

  if (entry.currencies) {
    await User.findOneAndUpdate({ _id: uid }, { currencies: entry.currencies })
  }

  if (entry.role) {
    await User.findOneAndUpdate({ _id: uid }, { role: entry.role })
  }

  if (entry.title) {
    await User.findOneAndUpdate({ _id: uid }, { title: entry.title })
  }

  return token
}
