import { LightningBtcWallet } from "./LightningBtcWallet"
import { LightningUsdWallet } from "./LightningUsdWallet"
import { BrokerWallet } from "./BrokerWallet";

import { User } from "./mongodb"
import { login, TEST_NUMBER } from "./text";
import * as jwt from 'jsonwebtoken';
import { baseLogger } from "./utils";

export const WalletFactory = ({uid, logger, currency = "BTC"}: {uid: string, currency: string, logger: any}) => {
  
  // FIXME:
  // trigger is currently instancing the broker wallet as a traditional LightningBtcWallet wallet
  // but the accounting path for LightningBtcWallet is Liabilities:Customer:uid 
  // and it is Liabilities:Broker for the broker
  // this is a temporary fix
  // 
  // broker id = ObjectId("5f8a1e6c2f410ed166a1b9ab")
  if (uid === "5f8a1e6c2f410ed166a1b9ab") {
    return new BrokerWallet({ uid, logger })
  }

// TODO: remove default BTC once old tokens had been "expired"
  if (currency === "USD") {
    return new LightningUsdWallet({uid, logger})
  } else {
    return new LightningBtcWallet({uid, logger})
  }
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
  const raw_token = await login({...TEST_NUMBER[index], logger: baseLogger})
  const token = jwt.verify(raw_token, process.env.JWT_SECRET);
  return token
}

// change role to broker
// FIXME there should be an API for this
// FIXME: this "power" user should not be able to log from a phone number
export async function createBrokerUid() {
  const {uid} = await getTokenFromPhoneIndex(7)
  await User.findOneAndUpdate({_id: uid}, {role: "broker"})
}