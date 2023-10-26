import { PartialResult } from "../partial-result"

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
import { checkedToAccountId } from "@/domain/accounts"

export const addEarn = async ({
  quizQuestionId: quizQuestionIdString,
  accountId: accountIdRaw,
}: {
  quizQuestionId: string
  accountId: string
}): Promise<
  PartialResult<{
    quiz: Quiz
    rewardPaid: boolean
  }>
> => {
  const accountId = checkedToAccountId(accountIdRaw)
  if (accountId instanceof Error) return PartialResult.err(accountId)

  const rewardsConfig = getRewardsConfig()

  // TODO: quizQuestionId checkedFor
  const quizQuestionId = quizQuestionIdString as QuizQuestionId

  const amount = OnboardingEarn[quizQuestionId]
  if (!amount) return PartialResult.err(new InvalidQuizQuestionIdError())

  const funderWalletId = await getFunderWalletId()
  const funderWallet = await WalletsRepository().findById(funderWalletId)
  if (funderWallet instanceof Error) return PartialResult.err(funderWallet)
  const funderAccount = await AccountsRepository().findById(funderWallet.accountId)
  if (funderAccount instanceof Error) return PartialResult.err(funderAccount)

  const recipientAccount = await AccountsRepository().findById(accountId)
  if (recipientAccount instanceof Error) return PartialResult.err(recipientAccount)

  const user = await UsersRepository().findById(recipientAccount.kratosUserId)
  if (user instanceof Error) return PartialResult.err(user)

  const isFirstTimeAnsweringQuestion =
    await RewardsRepository(accountId).add(quizQuestionId)
  if (isFirstTimeAnsweringQuestion instanceof Error)
    return PartialResult.err(isFirstTimeAnsweringQuestion)

  const quiz: Quiz = {
    id: quizQuestionId,
    amount: amount,
    completed: true,
  }

  const validatedPhoneMetadata = PhoneMetadataAuthorizer(
    rewardsConfig.phoneMetadataValidationSettings,
  ).authorize(user.phoneMetadata)

  if (validatedPhoneMetadata instanceof Error) {
    return PartialResult.partial(
      {
        quiz,
        rewardPaid: false,
      },
      new InvalidPhoneForRewardError(validatedPhoneMetadata.name),
    )
  }

  const accountIP = await AccountsIpsRepository().findLastByAccountId(recipientAccount.id)
  if (accountIP instanceof Error)
    return PartialResult.partial(
      {
        quiz,
        rewardPaid: false,
      },
      new InvalidPhoneForRewardError(accountIP),
    )

  const validatedIPMetadata = IPMetadataAuthorizer(
    rewardsConfig.ipMetadataValidationSettings,
  ).authorize(accountIP.metadata)

  if (validatedIPMetadata instanceof Error) {
    if (validatedIPMetadata instanceof MissingIPMetadataError)
      return PartialResult.partial(
        {
          quiz,
          rewardPaid: false,
        },
        new InvalidIpMetadataError(validatedIPMetadata),
      )

    if (validatedIPMetadata instanceof UnauthorizedIPError)
      return PartialResult.partial(
        {
          quiz,
          rewardPaid: false,
        },
        validatedIPMetadata,
      )

    return PartialResult.partial(
      {
        quiz,
        rewardPaid: false,
      },
      new UnknownRepositoryError("add earn error"),
    )
  }

  const recipientWallets = await WalletsRepository().listByAccountId(accountId)
  if (recipientWallets instanceof Error)
    return PartialResult.partial(
      {
        quiz,
        rewardPaid: false,
      },
      recipientWallets,
    )

  const recipientBtcWallet = recipientWallets.find(
    (wallet) => wallet.currency === WalletCurrency.Btc,
  )
  if (recipientBtcWallet === undefined)
    return PartialResult.partial(
      {
        quiz,
        rewardPaid: false,
      },
      new NoBtcWalletExistsForAccountError(),
    )

  const recipientWalletId = recipientBtcWallet.id

  const payment = await intraledgerPaymentSendWalletIdForBtcWallet({
    senderWalletId: funderWalletId,
    recipientWalletId,
    amount,
    memo: quizQuestionId,
    senderAccount: funderAccount,
  })

  if (payment instanceof Error)
    return PartialResult.partial(
      {
        quiz,
        rewardPaid: false,
      },
      payment,
    )

  return PartialResult.ok({
    quiz,
    rewardPaid: true,
  })
}

export const isAccountEligibleForEarnPayment = async ({
  accountId,
}: {
  accountId: AccountId
}): Promise<boolean | ApplicationError> => {
  const recipientAccount = await AccountsRepository().findById(accountId)
  if (recipientAccount instanceof Error) return recipientAccount

  const user = await UsersRepository().findById(recipientAccount.kratosUserId)
  if (user instanceof Error) return user

  const rewardsConfig = getRewardsConfig()

  const validatedPhoneMetadata = PhoneMetadataAuthorizer(
    rewardsConfig.phoneMetadataValidationSettings,
  ).authorize(user.phoneMetadata)

  if (validatedPhoneMetadata instanceof Error) {
    return false
  }

  const accountIP = await AccountsIpsRepository().findLastByAccountId(recipientAccount.id)
  if (accountIP instanceof Error) return accountIP

  const validatedIPMetadata = IPMetadataAuthorizer(
    rewardsConfig.ipMetadataValidationSettings,
  ).authorize(accountIP.metadata)

  if (validatedIPMetadata instanceof Error) return false

  return true
}
