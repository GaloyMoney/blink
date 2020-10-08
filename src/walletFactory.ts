import { LightningBtcWallet } from "./LightningBtcWallet"
import { LightningUsdWallet } from "./LightningUsdWallet"
import { BrokerWallet } from "./BrokerWallet";

import { User } from "./mongodb"

export const WalletFactory = ({uid, currency = "BTC"}: {uid: string, currency: string}) => {
// TODO: remove default BTC once old tokens had been "expired"
  if (currency === "USD") {
    return new LightningUsdWallet({uid})
  } else {
    return new LightningBtcWallet({uid})
  }
}

export const getFunderWallet = async () => {
  const funder = await User.findOne({ role: "funder" })
  return new LightningBtcWallet({ uid: funder._id })
}

export const getBrokerWallet = async () => {
  const broker = await User.findOne({ role: "broker" })
  return new BrokerWallet({ uid: broker._id })
}