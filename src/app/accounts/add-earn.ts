import { Payments } from "@app"
import { getRewardsConfig } from "@config"
import { IPMetadataValidator } from "@domain/accounts-ips/ip-metadata-validator"
import { checkedForQuizQuestionId, onboardingEarn } from "@domain/earn"
import {
  InvalidIPMetadataForRewardError,
  InvalidPhoneMetadataForRewardError,
  NoBtcWalletExistsForAccountError,
} from "@domain/errors"
import { WalletCurrency } from "@domain/shared"
import { PhoneMetadataValidator } from "@domain/users/phone-metadata-validator"
import { getFunderWalletId } from "@services/ledger/caching"
import {
  AccountsRepository,
  RewardsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { AccountsIpRepository } from "@services/mongoose/accounts-ips"

export const addEarn = async ({
  quizQuestionId: quizQuestionIdString,
  accountId,
  ip,
}: {
  quizQuestionId: string
  accountId: AccountId /* AccountId: aid validation */
  ip: IpAddress
}): Promise<QuizQuestion | ApplicationError> => {
  const rewardsConfig = getRewardsConfig()

  // ip check
  const accountIP = await AccountsIpRepository().findById(accountId)
  if (accountIP instanceof Error) return accountIP

  const ipFromDb = accountIP.lastIPs.find((ipObject) => ipObject.ip === ip)
  const validatedIPMetadata =
    IPMetadataValidator(rewardsConfig).validateForReward(ipFromDb)
  if (validatedIPMetadata instanceof Error) {
    return new InvalidIPMetadataForRewardError(validatedIPMetadata.name)
  }

  // phone metadata check
  const recipientAccount = await AccountsRepository().findById(accountId)
  if (recipientAccount instanceof Error) return recipientAccount

  const user = await UsersRepository().findById(recipientAccount.kratosUserId)
  if (user instanceof Error) return user

  const validatedPhoneMetadata = PhoneMetadataValidator(rewardsConfig).validateForReward(
    user.phoneMetadata,
  )

  if (validatedPhoneMetadata instanceof Error)
    return new InvalidPhoneMetadataForRewardError(validatedPhoneMetadata.name)

  const quizQuestionId = checkedForQuizQuestionId(quizQuestionIdString)
  if (quizQuestionId instanceof Error) return quizQuestionId

  const { amount } = onboardingEarn[quizQuestionId]

  const funderWalletId = await getFunderWalletId()
  const funderWallet = await WalletsRepository().findById(funderWalletId)
  if (funderWallet instanceof Error) return funderWallet
  const funderAccount = await AccountsRepository().findById(funderWallet.accountId)
  if (funderAccount instanceof Error) return funderAccount

  const recipientWallets = await WalletsRepository().listByAccountId(accountId)
  if (recipientWallets instanceof Error) return recipientWallets

  const recipientBtcWallet = recipientWallets.find(
    (wallet) => wallet.currency === WalletCurrency.Btc,
  )
  if (recipientBtcWallet === undefined) return new NoBtcWalletExistsForAccountError()
  const recipientWalletId = recipientBtcWallet.id

  const shouldGiveReward = await RewardsRepository(accountId).add(quizQuestionId)
  if (shouldGiveReward instanceof Error) return shouldGiveReward

  const payment = await Payments.intraledgerPaymentSendWalletId({
    senderWalletId: funderWalletId,
    recipientWalletId,
    amount,
    memo: quizQuestionId,
    senderAccount: funderAccount,
  })
  if (payment instanceof Error) return payment

  return { id: quizQuestionId, earnAmount: amount }
}
