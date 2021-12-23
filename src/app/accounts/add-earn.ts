import { getUser } from "@app/users"
import { getBalanceForWalletId, intraledgerPaymentSendWalletId } from "@app/wallets"
import { onboardingEarn } from "@config/app"
import {
  RewardInsufficientBalanceError,
  RewardMissingMetadataError,
  RewardNonValidTypeError,
  ValidationError,
} from "@domain/errors"
import { getFunderWalletId } from "@services/ledger/accounts"
import { baseLogger } from "@services/logger"
import { RewardsRepository } from "@services/mongoose/rewards"
import { getAccount } from "."

export const addEarn = async ({
  id,
  aid,
}: {
  id: QuizQuestionId
  aid: AccountId /* AccountId: aid validation */
}) => {
  const amount = onboardingEarn[id]
  if (!amount) {
    return new ValidationError("incorrect reward id")
  }

  const funderWalletId = await getFunderWalletId()

  const balanceFunder = await getBalanceForWalletId(funderWalletId)
  if (balanceFunder instanceof Error) return balanceFunder

  if (amount > balanceFunder) {
    return new RewardInsufficientBalanceError()
  }

  const recipientAccount = await getAccount(aid)
  if (recipientAccount instanceof Error) return recipientAccount

  const user = await getUser(recipientAccount.ownerId)
  if (user instanceof Error) return user

  if (!user.phoneMetadata?.carrier) {
    return new RewardMissingMetadataError()
  }

  if (user.phoneMetadata.carrier.type === "voip") {
    return new RewardNonValidTypeError()
  }

  const recipientWalletId = recipientAccount.defaultWalletId

  const shouldGiveReward = await RewardsRepository(aid).tentativelyAddNew(id)
  if (shouldGiveReward instanceof Error) return shouldGiveReward

  const payment = await intraledgerPaymentSendWalletId({
    payerWalletId: funderWalletId,
    payerUserId: recipientAccount.ownerId,
    recipientWalletId,
    amount,
    memo: id,
    logger: baseLogger, // FIXME
  })
  if (payment instanceof Error) return payment

  return { id, value: amount, completed: true }
}
