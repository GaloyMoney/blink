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
  | {
      quizQuestion: Quiz
      rewardPaymentError?: ApplicationError
    }
  | ApplicationError
> => {
  const accountId = checkedToAccountId(accountIdRaw)
  if (accountId instanceof Error) return accountId

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

  const isFirstTimeAnsweringQuestion =
    await RewardsRepository(accountId).add(quizQuestionId)
  if (isFirstTimeAnsweringQuestion instanceof Error) return isFirstTimeAnsweringQuestion

  const quizQuestion: Quiz = {
    id: quizQuestionId,
    amount: amount,
    completed: true,
  }

  const validatedPhoneMetadata = PhoneMetadataAuthorizer(
    rewardsConfig.phoneMetadataValidationSettings,
  ).authorize(user.phoneMetadata)

  if (validatedPhoneMetadata instanceof Error) {
    return {
      quizQuestion,
      rewardPaymentError: new InvalidPhoneForRewardError(validatedPhoneMetadata.name),
    }
  }

  const accountIP = await AccountsIpsRepository().findLastByAccountId(recipientAccount.id)
  if (accountIP instanceof Error) return accountIP

  const validatedIPMetadata = IPMetadataAuthorizer(
    rewardsConfig.ipMetadataValidationSettings,
  ).authorize(accountIP.metadata)

  if (validatedIPMetadata instanceof Error) {
    if (validatedIPMetadata instanceof MissingIPMetadataError)
      return {
        quizQuestion,
        rewardPaymentError: new InvalidIpMetadataError(validatedIPMetadata),
      }

    if (validatedIPMetadata instanceof UnauthorizedIPError)
      return {
        quizQuestion,
        rewardPaymentError: validatedIPMetadata,
      }

    return {
      quizQuestion,
      rewardPaymentError: new UnknownRepositoryError("add earn error"),
    }
  }

  const recipientWallets = await WalletsRepository().listByAccountId(accountId)
  if (recipientWallets instanceof Error)
    return {
      quizQuestion,
      rewardPaymentError: recipientWallets,
    }

  const recipientBtcWallet = recipientWallets.find(
    (wallet) => wallet.currency === WalletCurrency.Btc,
  )
  if (recipientBtcWallet === undefined)
    return {
      quizQuestion,
      rewardPaymentError: new NoBtcWalletExistsForAccountError(),
    }

  const recipientWalletId = recipientBtcWallet.id

  const payment = await intraledgerPaymentSendWalletIdForBtcWallet({
    senderWalletId: funderWalletId,
    recipientWalletId,
    amount,
    memo: quizQuestionId,
    senderAccount: funderAccount,
  })

  return {
    quizQuestion,
    rewardPaymentError: payment instanceof Error ? payment : undefined,
  }
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
