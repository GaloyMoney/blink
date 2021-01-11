import * as jwt from 'jsonwebtoken';
import { BrokerWallet } from "./BrokerWallet";
import { getLastPrice } from "./cache";
import { LightningUserWallet } from "./LightningUserWallet";
import { User } from "./mongodb";
import { login, TEST_NUMBER } from "./text";
import { baseLogger, LoggedError } from "./utils";
import { UserWallet } from "./wallet";


export const WalletFactory = async ({ user, logger }: { user: any, logger: any }) => {
  // FIXME: update price on event outside of the wallet factory
  const lastPrice = await getLastPrice()
  UserWallet.setCurrentPrice(lastPrice)

  if (user.role === "broker") {
    return new BrokerWallet({ user, logger })
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
  const funder = await User.findOne({ username: "***REMOVED***" })
  return WalletFactory({ user: funder, logger })
}

export const getBrokerWallet = async ({ logger }) => {
  const broker = await User.findOne({ role: "broker" })
  return WalletFactory({ user: broker, logger })
}

// utils function for test
export const getTokenFromPhoneIndex = async (index) => {
  const entry = TEST_NUMBER[index]
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

  return token
}
