import { intraledgerPaymentSendWalletIdForBtcWallet } from "../payments/send-intraledger"

import { listQuizzesByAccountId } from "./list"

import { QuizzesValue } from "@/domain/quiz"

import { getQuizzesConfig } from "@/config"

import { getBalanceForWallet } from "@/app/wallets"

import {
  InvalidIpMetadataError,
  InvalidQuizQuestionIdError,
  MissingIPMetadataError,
  NoBtcWalletExistsForAccountError,
  NotEnoughBalanceForQuizError,
  QuizClaimedTooEarlyError,
} from "@/domain/errors"
import { WalletCurrency } from "@/domain/shared"
import { RateLimitConfig } from "@/domain/rate-limit"
import { checkedToAccountId } from "@/domain/accounts"
import { PhoneMetadataAuthorizer } from "@/domain/users"
import { InvalidPhoneForQuizError } from "@/domain/users/errors"
import { RateLimiterExceededError } from "@/domain/rate-limit/errors"
import { IPMetadataAuthorizer } from "@/domain/accounts-ips/ip-metadata-authorizer"

import {
  AccountsRepository,
  QuizRepository,
  WalletsRepository,
  UsersRepository,
} from "@/services/mongoose"
import { consumeLimiter } from "@/services/rate-limit"
import { getFunderWalletId } from "@/services/ledger/caching"
import { AccountsIpsRepository } from "@/services/mongoose/accounts-ips"

type ClaimQuizResult = {
  id: QuizQuestionId
  amount: Satoshis
  completed: boolean
  notBefore: Date | undefined
}[]

const checkAddQuizAttemptPerIpLimits = async (
  ip: IpAddress | undefined,
): Promise<true | RateLimiterExceededError> => {
  if (!ip) return new InvalidIpMetadataError()

  return consumeLimiter({
    rateLimitConfig: RateLimitConfig.addQuizAttemptPerIp,
    keyToConsume: ip,
  })
}

export const claimQuiz = async ({
  quizQuestionId: quizQuestionIdString,
  accountId: accountIdRaw,
  ip,
}: {
  quizQuestionId: string
  accountId: string
  ip: IpAddress | undefined
}): Promise<ClaimQuizResult | ApplicationError> => {
  const check = await checkAddQuizAttemptPerIpLimits(ip)
  if (check instanceof Error) return check

  const accountId = checkedToAccountId(accountIdRaw)
  if (accountId instanceof Error) return accountId

  const quizzesConfig = getQuizzesConfig()

  // TODO: quizQuestionId checkedFor
  const quizId = quizQuestionIdString as QuizQuestionId

  const amount = QuizzesValue[quizId]
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
    quizzesConfig.phoneMetadataValidationSettings,
  ).authorize(user.phoneMetadata)

  if (validatedPhoneMetadata instanceof Error) {
    return new InvalidPhoneForQuizError(validatedPhoneMetadata.name)
  }

  const accountIP = await AccountsIpsRepository().findLastByAccountId(recipientAccount.id)
  if (accountIP instanceof Error) return accountIP

  const validatedIPMetadata = IPMetadataAuthorizer(
    quizzesConfig.ipMetadataValidationSettings,
  ).authorize(accountIP.metadata)
  if (validatedIPMetadata instanceof Error) {
    if (validatedIPMetadata instanceof MissingIPMetadataError)
      return new InvalidIpMetadataError(validatedIPMetadata)

    return validatedIPMetadata
  }

  const quizzesBefore = await listQuizzesByAccountId(accountId)
  if (quizzesBefore instanceof Error) return quizzesBefore

  const quiz = quizzesBefore.find((quiz) => quiz.id === quizId)
  if (quiz === undefined) return new InvalidQuizQuestionIdError()

  if (quiz.notBefore && quiz.notBefore > new Date()) return new QuizClaimedTooEarlyError()

  const recipientWallets = await WalletsRepository().listByAccountId(accountId)
  if (recipientWallets instanceof Error) return recipientWallets

  const recipientBtcWallet = recipientWallets.find(
    (wallet) => wallet.currency === WalletCurrency.Btc,
  )
  if (recipientBtcWallet === undefined) return new NoBtcWalletExistsForAccountError()
  const recipientWalletId = recipientBtcWallet.id

  const funderBalance = await getBalanceForWallet({ walletId: funderWalletId })
  if (funderBalance instanceof Error) return funderBalance

  const sendCheck = FunderBalanceChecker().check({
    balance: funderBalance as Satoshis,
    amountToSend: amount,
  })
  if (sendCheck instanceof Error) return sendCheck

  const shouldGiveSats = await QuizRepository().add({ quizId, accountId })
  if (shouldGiveSats instanceof Error) return shouldGiveSats

  const payment = await intraledgerPaymentSendWalletIdForBtcWallet({
    senderWalletId: funderWalletId,
    recipientWalletId,
    amount,
    memo: quizId,
    senderAccount: funderAccount,
  })
  if (payment instanceof Error) return payment

  const quizzesAfter = await listQuizzesByAccountId(accountId)
  if (quizzesAfter instanceof Error) return quizzesAfter

  return quizzesAfter
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
      return new NotEnoughBalanceForQuizError(JSON.stringify({ balance, amountToSend }))
    }

    return true
  }

  return { check }
}
