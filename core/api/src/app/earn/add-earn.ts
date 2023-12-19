import { intraledgerPaymentSendWalletIdForBtcWallet } from "../payments/send-intraledger"

import { getRewardsConfig } from "@/config"

import { getBalanceForWallet } from "@/app/wallets"

import {
  InvalidIpMetadataError,
  InvalidQuizQuestionIdError,
  MissingIPMetadataError,
  NoBtcWalletExistsForAccountError,
  NotEnoughBalanceForRewardError,
  UnauthorizedIPError,
  UnknownRepositoryError,
} from "@/domain/errors"
import { WalletCurrency } from "@/domain/shared"
import { RateLimitConfig } from "@/domain/rate-limit"
import { checkedToAccountId } from "@/domain/accounts"
import { PhoneMetadataAuthorizer } from "@/domain/users"
import { InvalidPhoneForRewardError } from "@/domain/users/errors"
import { RateLimiterExceededError } from "@/domain/rate-limit/errors"
import { IPMetadataAuthorizer } from "@/domain/accounts-ips/ip-metadata-authorizer"

import {
  AccountsRepository,
  RewardsRepository,
  WalletsRepository,
  UsersRepository,
} from "@/services/mongoose"
import { consumeLimiter } from "@/services/rate-limit"
import { getFunderWalletId } from "@/services/ledger/caching"
import { AccountsIpsRepository } from "@/services/mongoose/accounts-ips"
import { OnboardingEarn } from "./config"

export const addEarn = async ({
  quizQuestionId: quizQuestionIdString,
  accountId: accountIdRaw,
  ip,
}: {
  quizQuestionId: string
  accountId: string
  ip: IpAddress | undefined
}): Promise<QuizQuestion | ApplicationError> => {
  const check = await checkAddEarnAttemptPerIpLimits(ip)
  if (check instanceof Error) return check

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

  const validatedPhoneMetadata = PhoneMetadataAuthorizer(
    rewardsConfig.phoneMetadataValidationSettings,
  ).authorize(user.phoneMetadata)

  if (validatedPhoneMetadata instanceof Error) {
    return new InvalidPhoneForRewardError(validatedPhoneMetadata.name)
  }

  const accountIP = await AccountsIpsRepository().findLastByAccountId(recipientAccount.id)
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

  const recipientWallets = await WalletsRepository().listByAccountId(accountId)
  if (recipientWallets instanceof Error) return recipientWallets

  const recipientBtcWallet = recipientWallets.find(
    (wallet) => wallet.currency === WalletCurrency.Btc,
  )
  if (recipientBtcWallet === undefined) return new NoBtcWalletExistsForAccountError()
  const recipientWalletId = recipientBtcWallet.id

  const shouldGiveReward = await RewardsRepository(accountId).add(quizQuestionId)
  if (shouldGiveReward instanceof Error) return shouldGiveReward

  const funderBalance = await getBalanceForWallet({ walletId: funderWalletId })
  if (funderBalance instanceof Error) return funderBalance

  const sendCheck = FunderBalanceChecker().check({
    balance: funderBalance as Satoshis,
    amountToSend: amount,
  })
  if (sendCheck instanceof Error) return sendCheck

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

const checkAddEarnAttemptPerIpLimits = async (
  ip: IpAddress | undefined,
): Promise<true | RateLimiterExceededError> => {
  if (!ip) return new InvalidIpMetadataError()

  return consumeLimiter({
    rateLimitConfig: RateLimitConfig.addEarnAttemptPerIp,
    keyToConsume: ip,
  })
}

const FunderBalanceChecker = () => {
  const check = ({
    balance,
    amountToSend,
  }: {
    balance: Satoshis
    amountToSend: Satoshis
  }): ValidationError | true => {
    if (balance < amountToSend) {
      return new NotEnoughBalanceForRewardError(JSON.stringify({ balance, amountToSend }))
    }

    return true
  }

  return { check }
}
