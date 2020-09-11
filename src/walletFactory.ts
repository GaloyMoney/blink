import { LightningBtcWallet } from "./LightningBtcWallet"
import { LightningUsdWallet } from "./LightningUsdWallet"
import { User } from "./mongodb"

export const WalletFactory = ({uid, currency = "BTC"}: {uid: string, currency: string}) => {
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