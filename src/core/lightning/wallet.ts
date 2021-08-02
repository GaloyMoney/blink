import { User } from "@services/mongoose/schema"

import { CustomError } from "../error"
import { LightningMixin } from "."
import { redlock } from "../lock"
import { OnChainMixin } from "../on-chain"
import { onboardingEarn } from "@config/app"
import { UserWallet } from "../user-wallet"
import { getWalletFromRole } from "../wallet-factory"

/**
 * this represents a user wallet
 */
export class LightningUserWallet extends OnChainMixin(LightningMixin(UserWallet)) {
  constructor(args: UserWalletConstructorArgs) {
    super({ ...args })
  }

  async addEarn(ids) {
    if (this.user?.twilio?.carrier?.type === "voip") {
      throw new CustomError(
        "reward can only be given on non voip-based phone",
        "VOIP_REWARD_RESTRICTED",
        {
          forwardToClient: true,
          logger: this.logger,
          level: "warn",
          metadata: undefined,
        },
      )
    }

    const lightningFundingWallet = await getWalletFromRole({
      role: "funder",
      logger: this.logger,
    })

    return await redlock({ path: this.user._id, logger: this.logger }, async () => {
      const result: Record<string, unknown>[] = []

      for (const id of ids) {
        const amount = onboardingEarn[id]

        const userPastState = await User.findOneAndUpdate(
          { _id: this.user._id },
          { $push: { earn: id } },
          { upsert: true },
        )

        if (userPastState.earn.findIndex((item) => item === id) === -1) {
          // FIXME: use pay by username instead
          const invoice = await this.addInvoice({ memo: id, value: amount })
          await lightningFundingWallet.pay({ invoice, isReward: true })
        }

        result.push({ id, value: amount, completed: true })
      }

      return result
    })
  }
}
