import { getUser } from "@app/users"
import { intraledgerPaymentSendWalletId } from "@app/wallets"
import { onboardingEarn } from "@config"
import {
  PhoneMetadataForRewardBlockedError,
  IpMetadataForRewardBlockedError,
  InvalidQuizQuestionIdError,
} from "@domain/errors"
import { PhoneMetadataValidator } from "@domain/users/phone-metadata-validator"
import { IpMetadataValidator } from "@domain/users/ip-metadata-validator"
import { getFunderWalletId } from "@services/ledger/accounts"
import {
  RewardsRepository,
  AccountsRepository,
  UsersIpRepository,
} from "@services/mongoose"

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
  if (!amount) return new InvalidQuizQuestionIdError()

  const funderWalletId = await getFunderWalletId()

  const recipientAccount = await AccountsRepository().findById(accountId)
  if (recipientAccount instanceof Error) return recipientAccount

  const user = await getUser(recipientAccount.ownerId)
  if (user instanceof Error) return user

  const validatedPhoneMetadata = PhoneMetadataValidator().validate(user.phoneMetadata)
  if (validatedPhoneMetadata instanceof Error)
    return new PhoneMetadataForRewardBlockedError(validatedPhoneMetadata.name)

  const userIP = await UsersIpRepository().findById(user.id)
  if (userIP instanceof Error) return userIP

  const validatedIpMetadata = IpMetadataValidator().validate(userIP)
  if (validatedIpMetadata instanceof Error)
    return new IpMetadataForRewardBlockedError(validatedIpMetadata.name)

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
