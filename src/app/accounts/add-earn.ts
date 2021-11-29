import { User } from "@services/mongoose/schema"

import { redlock } from "../lock"
import { onboardingEarn } from "@config/app"
import { addInvoice, lnInvoicePaymentSend } from "@app/wallets"
import { UsersRepository } from "@services/mongoose"

export const addEarn = async ({
  id,
  aid,
}: {
  id: QuizQuestionId
  aid: AccountId
}): Promise<true | ApplicationError> => {
  const user = await UsersRepository().findById(aid as unknown as UserId)
  if (user instanceof Error) return user

  if (!user.phoneMetadata || !user.phoneMetadata.carrier) {
    return new RewardErrorMissingMetadata()
  }

  if (user.phoneMetadata.carrier.type === "voip") {
    return new RewardErrorNonValidType()
  }

  // const lightningFundingWallet = await getWalletFromRole({
  //   role: "funder",
  //   logger: this.logger,
  // })

  return redlock({ path: this.user._id, logger: this.logger }, async () => {
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
          walletId: this.user.id,
          amount,
          memo: id,
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const payResult = await lnInvoicePaymentSend({
          paymentRequest: lnInvoice.paymentRequest,
          memo: null,
          walletId: lightningFundingWallet.user.id,
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
