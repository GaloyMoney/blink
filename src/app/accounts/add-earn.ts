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
import { RewardsRepository } from "@services/mongoose"
import { getAccount } from "."

export const addEarn = async ({
  quizQuestionId,
  accountId,
  logger,
}: {
  quizQuestionId: QuizQuestionId
  accountId: AccountId /* AccountId: aid validation */
  logger: Logger
}) => {
  const amount = onboardingEarn[quizQuestionId]
  if (!amount) {
    return new ValidationError("incorrect reward id")
  }

  const funderWalletId = await getFunderWalletId()

  const balanceFunder = await getBalanceForWalletId(funderWalletId)
  if (balanceFunder instanceof Error) return balanceFunder

  // this check is redundant but we are using it to populate a more precise error
  // instead of InsuffisantBalanceError, we get RewardInsufficientBalanceError
  if (amount > balanceFunder) {
    return new RewardInsufficientBalanceError()
  }

  const recipientAccount = await getAccount(accountId)
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

  const shouldGiveReward = await RewardsRepository(accountId).add(quizQuestionId)
  if (shouldGiveReward instanceof Error) return shouldGiveReward

  const payment = await intraledgerPaymentSendWalletId({
    senderWalletId: funderWalletId,
    recipientWalletId,
    amount,
    memo: quizQuestionId,
    logger,
  })
  if (payment instanceof Error) return payment

  return { id: quizQuestionId, value: amount, completed: true }
}
