import { LightningBtcWallet } from "./LightningBtcWallet"
import { LightningUsdWallet } from "./LightningUsdWallet"
import { BrokerWallet } from "./BrokerWallet";

import { User } from "./mongodb"
import { login, TEST_NUMBER } from "./text";
import * as jwt from 'jsonwebtoken';
import { baseLogger, LoggedError } from "./utils";

export const WalletFactory = ({ uid, logger, currency = "BTC" }: { uid: string, currency: string, logger: any }) => {
  // TODO: remove default BTC once old tokens had been "expired"
  if (currency === "USD") {
    return new LightningUsdWallet({ uid, logger })
  } else {
    return new LightningBtcWallet({ uid, logger })
  }
}

export const WalletFromUsername = async ({ username, logger }: { username: string, logger: any }) => {
  const user = await User.findOne({ username })
  if (!user) {
    const error = `User not found`
    logger.warn(error)
    throw new LoggedError(error)
  }

  const { _id, currency } = user

  return WalletFactory({ uid: _id, currency, logger })
}

export const getFunderWallet = async ({ logger }) => {
  const funder = await User.findOne({ role: "funder" })
  return new LightningBtcWallet({ uid: funder._id, logger })
}

export const getBrokerWallet = async ({ logger }) => {
  const broker = await User.findOne({ role: "broker" })
  return new BrokerWallet({ uid: broker._id, logger })
}

export const getTokenFromPhoneIndex = async (index) => {
  const raw_token = await login({ ...TEST_NUMBER[index], logger: baseLogger })
  const token = jwt.verify(raw_token, process.env.JWT_SECRET);
  return token
}

// change role to broker
// FIXME there should be an API for this
// FIXME: this "power" user should not be able to log from a phone number
export async function createBrokerUid() {
  const { uid } = await getTokenFromPhoneIndex(7)
  await User.findOneAndUpdate({ _id: uid }, { role: "broker" })
}