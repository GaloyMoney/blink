import { User } from "@services/mongoose/schema"

import { CustomError } from "../error"
import { redlock } from "../lock"
import { OnChainMixin } from "../on-chain"
import { onboardingEarn } from "@config/app"
import { UserWallet } from "../user-wallet"
import { getWalletFromRole } from "../wallet-factory"
import { addInvoice, lnInvoicePaymentSend } from "@app/wallets"

/**
 * this represents a user wallet
 */
export class LightningUserWallet extends OnChainMixin(UserWallet) {
  constructor(args: UserWalletConstructorArgs) {
    super(args)
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

    return redlock({ path: this.user.walletId, logger: this.logger }, async () => {
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
          const lnInvoice = await addInvoice({
            walletId: this.user.walletId,
            amount,
            memo: id,
          })
          if (lnInvoice instanceof Error) throw lnInvoice

          const payResult = await lnInvoicePaymentSend({
            paymentRequest: lnInvoice.paymentRequest,
            memo: null,
            walletId: lightningFundingWallet.user.walletId,
            userId: lightningFundingWallet.user.id,
            logger: this.logger,
          })
          if (payResult instanceof Error) throw payResult
        }

        result.push({ id, value: amount, completed: true })
      }

      return result
    })
  }
}
