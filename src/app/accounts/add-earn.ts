import { getUser } from "@app/users"
import { intraledgerPaymentSendWalletId } from "@app/wallets"
import { onboardingEarn } from "@config/app"
import {
  InvalidQuizQuestionIdError,
  RewardMissingMetadataError,
  RewardNonValidTypeError,
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
}): Promise<QuizQuestion | ApplicationError> => {
  const amount = onboardingEarn[quizQuestionId]
  if (amount === undefined) return new InvalidQuizQuestionIdError()

  const funderWalletId = await getFunderWalletId()

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

  return { id: quizQuestionId, earnAmount: amount }
}
