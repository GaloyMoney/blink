import { LightningBtcWallet } from "./LightningBtcWallet"
import { LightningUsdWallet } from "./LightningUsdWallet"
import { User } from "./mongodb"

export const WalletFactory = async ({uid, currency}: {uid: string, currency?: string}) => {
  let _currency = currency

  if (!currency) {
    ({currency: _currency} = await User.findOne({_id: uid}))
  }

  if (_currency === "USD") {
    return new LightningUsdWallet({uid})
  } else {
    return new LightningBtcWallet({uid})
  }
}