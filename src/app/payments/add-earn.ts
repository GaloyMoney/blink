import { getRewardsConfig, OnboardingEarn } from "@config"
import { IPMetadataAuthorizer } from "@domain/accounts-ips/ip-metadata-authorizer"
import {
  InvalidIpMetadataError,
  InvalidPhoneMetadataForRewardError,
  InvalidQuizQuestionIdError,
  MissingIPMetadataError,
  NoBtcWalletExistsForAccountError,
  UnauthorizedIPForRewardError,
  UnknownRepositoryError,
} from "@domain/errors"
import { WalletCurrency } from "@domain/shared"
import { PhoneMetadataAuthorizer } from "@domain/users/phone-metadata-authorizer"
import { getFunderWalletId } from "@services/ledger/caching"
import {
  AccountsRepository,
  RewardsRepository,
  WalletsRepository,
  UsersRepository,
} from "@services/mongoose"
import { AccountsIpsRepository } from "@services/mongoose/accounts-ips"

import { intraledgerPaymentSendWalletIdForBtcWallet } from "./send-intraledger"

export const addEarn = async ({
  quizQuestionId: quizQuestionIdString,
  accountId,
}: {
  quizQuestionId: string
  accountId: AccountId /* AccountId: aid validation */
}): Promise<QuizQuestion | ApplicationError> => {
  const rewardsConfig = getRewardsConfig()

  // TODO: quizQuestionId checkedFor
  const quizQuestionId = quizQuestionIdString as QuizQuestionId

  const amount = OnboardingEarn[quizQuestionId]
  if (!amount) return new InvalidQuizQuestionIdError()

  const funderWalletId = await getFunderWalletId()
  const funderWallet = await WalletsRepository().findById(funderWalletId)
  if (funderWallet instanceof Error) return funderWallet
  const funderAccount = await AccountsRepository().findById(funderWallet.accountId)
  if (funderAccount instanceof Error) return funderAccount

  const recipientAccount = await AccountsRepository().findById(accountId)
  if (recipientAccount instanceof Error) return recipientAccount

  const user = await UsersRepository().findById(recipientAccount.kratosUserId)
  if (user instanceof Error) return user

  const validatedPhoneMetadata = PhoneMetadataAuthorizer(
    rewardsConfig.phoneMetadataValidationSettings,
  ).authorize(user.phoneMetadata)

  if (validatedPhoneMetadata instanceof Error)
    return new InvalidPhoneMetadataForRewardError(validatedPhoneMetadata)

  const accountIP = await AccountsIpsRepository().findLastByAccountId(recipientAccount.id)
  if (accountIP instanceof Error) return accountIP

  const validatedIPMetadata = IPMetadataAuthorizer(
    rewardsConfig.ipMetadataValidationSettings,
  ).authorize(accountIP.metadata)
  if (validatedIPMetadata instanceof Error) {
    if (validatedIPMetadata instanceof MissingIPMetadataError)
      return new InvalidIpMetadataError(validatedIPMetadata)

    if (validatedIPMetadata instanceof UnauthorizedIPForRewardError)
      return validatedIPMetadata

    return new UnknownRepositoryError("add earn error")
  }

  const recipientWallets = await WalletsRepository().listByAccountId(accountId)
  if (recipientWallets instanceof Error) return recipientWallets

  const recipientBtcWallet = recipientWallets.find(
    (wallet) => wallet.currency === WalletCurrency.Btc,
  )
  if (recipientBtcWallet === undefined) return new NoBtcWalletExistsForAccountError()
  const recipientWalletId = recipientBtcWallet.id

  const shouldGiveReward = await RewardsRepository(accountId).add(quizQuestionId)
  if (shouldGiveReward instanceof Error) return shouldGiveReward

  const payment = await intraledgerPaymentSendWalletIdForBtcWallet({
    senderWalletId: funderWalletId,
    recipientWalletId,
    amount,
    memo: quizQuestionId,
    senderAccount: funderAccount,
  })
  if (payment instanceof Error) return payment

  return { id: quizQuestionId, earnAmount: amount }
}
