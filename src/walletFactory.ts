import { LightningBtcWallet } from "./LightningBtcWallet"
import { LightningUsdWallet } from "./LightningUsdWallet"

export const WalletFactory = (token) => {
  if (token.currency === "USD") {
    return new LightningUsdWallet({uid: token.uid})
  } else {
    return new LightningBtcWallet({uid: token.uid})
  }
}