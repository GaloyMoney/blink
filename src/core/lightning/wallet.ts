import { OnChainMixin } from "../on-chain"
import { UserWallet } from "../user-wallet"

/**
 * this represents a user wallet
 */
export class LightningUserWallet extends OnChainMixin(UserWallet) {
  constructor(args: UserWalletConstructorArgs) {
    super(args)
  }
}
