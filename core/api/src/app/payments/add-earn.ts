import { intraledgerPaymentSendWalletIdForBtcWallet } from "./send-intraledger"

import { getRewardsConfig, OnboardingEarn } from "@/config"
import { IPMetadataAuthorizer } from "@/domain/accounts-ips/ip-metadata-authorizer"
import {
  InvalidIpMetadataError,
  InvalidQuizQuestionIdError,
  MissingIPMetadataError,
  NoBtcWalletExistsForAccountError,
  UnauthorizedIPError,
  UnknownRepositoryError,
} from "@/domain/errors"
import { InvalidPhoneForRewardError } from "@/domain/users/errors"
import { WalletCurrency } from "@/domain/shared"
import { PhoneMetadataAuthorizer } from "@/domain/users"
import { getFunderWalletId } from "@/services/ledger/caching"
import {
  AccountsRepository,
  RewardsRepository,
  WalletsRepository,
  UsersRepository,
} from "@/services/mongoose"
import { AccountsIpsRepository } from "@/services/mongoose/accounts-ips"
import { checkedToAccountUuid } from "@/domain/accounts"

export const addEarn = async ({
  quizQuestionId: quizQuestionIdString,
  accountUuid: accountUuidRaw,
}: {
  quizQuestionId: string
  accountUuid: string
}): Promise<QuizQuestion | ApplicationError> => {
  const accountUuid = checkedToAccountUuid(accountUuidRaw)
  if (accountUuid instanceof Error) return accountUuid

  const rewardsConfig = getRewardsConfig()

  // TODO: quizQuestionId checkedFor
  const quizQuestionId = quizQuestionIdString as QuizQuestionId

  const amount = OnboardingEarn[quizQuestionId]
  if (!amount) return new InvalidQuizQuestionIdError()

  const funderWalletId = await getFunderWalletId()
  const funderWallet = await WalletsRepository().findById(funderWalletId)
  if (funderWallet instanceof Error) return funderWallet
  const funderAccount = await AccountsRepository().findByUuid(funderWallet.accountUuid)
  if (funderAccount instanceof Error) return funderAccount

  const recipientAccount = await AccountsRepository().findByUuid(accountUuid)
  if (recipientAccount instanceof Error) return recipientAccount

  const user = await UsersRepository().findById(recipientAccount.kratosUserId)
  if (user instanceof Error) return user

  const validatedPhoneMetadata = PhoneMetadataAuthorizer(
    rewardsConfig.phoneMetadataValidationSettings,
  ).authorize(user.phoneMetadata)

  if (validatedPhoneMetadata instanceof Error) {
    return new InvalidPhoneForRewardError(validatedPhoneMetadata.name)
  }

  const accountIP = await AccountsIpsRepository().findLastByAccountUuid(
    recipientAccount.uuid,
  )
  if (accountIP instanceof Error) return accountIP

  const validatedIPMetadata = IPMetadataAuthorizer(
    rewardsConfig.ipMetadataValidationSettings,
  ).authorize(accountIP.metadata)
  if (validatedIPMetadata instanceof Error) {
    if (validatedIPMetadata instanceof MissingIPMetadataError)
      return new InvalidIpMetadataError(validatedIPMetadata)

    if (validatedIPMetadata instanceof UnauthorizedIPError) return validatedIPMetadata

    return new UnknownRepositoryError("add earn error")
  }

  const recipientWallets = await WalletsRepository().listByAccountUuid(accountUuid)
  if (recipientWallets instanceof Error) return recipientWallets

  const recipientBtcWallet = recipientWallets.find(
    (wallet) => wallet.currency === WalletCurrency.Btc,
  )
  if (recipientBtcWallet === undefined) return new NoBtcWalletExistsForAccountError()
  const recipientWalletId = recipientBtcWallet.id

  const shouldGiveReward = await RewardsRepository(accountUuid).add(quizQuestionId)
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
