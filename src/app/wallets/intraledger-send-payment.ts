import { getAccount } from "@app/accounts"
import { getCurrentPrice } from "@app/prices"
import { getUser } from "@app/users"
import { addNewContact } from "@app/users/add-new-contact"
import { getWallet } from "@app/wallets"
import { toSats } from "@domain/bitcoin"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import {
  InsufficientBalanceError,
  NoWalletExistsForUserError,
  SatoshiAmountRequiredError,
  SelfPaymentError,
} from "@domain/errors"
import { LedgerService } from "@services/ledger"
import { LockService } from "@services/lock"
import { UsersRepository } from "@services/mongoose"
import { NotificationsService } from "@services/notifications"

import { checkAndVerifyTwoFA, checkIntraledgerLimits } from "./check-limit-helpers"
import { getBalanceForWalletId } from "./get-balance-for-wallet"

export const intraledgerPaymentSendUsername = async ({
  recipientUsername,
  amount,
  memo,
  senderWalletId,
  payerUserId,
  logger,
}: IntraLedgerPaymentSendUsernameArgs): Promise<PaymentSendStatus | ApplicationError> => {
  if (!(amount && amount > 0)) {
    return new SatoshiAmountRequiredError()
  }

  const user = await getUser(payerUserId)
  if (user instanceof Error) return user

  const account = await getAccount(user.defaultAccountId)
  if (account instanceof Error) return account

  return intraLedgerSendPaymentUsername({
    payerUserId,
    senderWalletId,
    payerUsername: account.username,
    recipientUsername,
    amount,
    memo: memo || "",
    logger,
  })
}

export const intraledgerPaymentSendWalletId = async ({
  recipientWalletId,
  amount,
  memo,
  senderWalletId,
  logger,
}: IntraLedgerPaymentSendWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  if (!(amount && amount > 0)) {
    return new SatoshiAmountRequiredError()
  }

  if (senderWalletId === recipientWalletId) return new SelfPaymentError()

  const paymentSendStatus = await executePaymentViaIntraledger({
    senderWalletId,
    recipientUsername: null,
    recipientWalletId,
    amount,
    memoPayer: memo || "",
    payerUsername: null,
    logger,
  })

  return paymentSendStatus
}

// FIXME: unused currently
export const intraledgerSendPaymentUsernameWithTwoFA = async ({
  twoFAToken,
  recipientUsername,
  // payerUsername,
  amount,
  memo,
  senderWalletId,
  payerUserId,
  logger,
}: IntraLedgerPaymentSendWithTwoFAArgs): Promise<
  PaymentSendStatus | ApplicationError
> => {
  if (!(amount && amount > 0)) {
    return new SatoshiAmountRequiredError()
  }

  const user = await getUser(payerUserId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const twoFACheck = twoFA?.secret
    ? await checkAndVerifyTwoFA({
        amount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        walletId: senderWalletId,
      })
    : true
  if (twoFACheck instanceof Error) return twoFACheck

  const account = await getAccount(user.defaultAccountId)
  if (account instanceof Error) return account

  return intraLedgerSendPaymentUsername({
    payerUserId,
    senderWalletId,
    payerUsername: account.username,
    recipientUsername,
    amount,
    memo: memo || "",
    logger,
  })
}

const intraLedgerSendPaymentUsername = async ({
  payerUserId,
  senderWalletId,
  payerUsername,
  recipientUsername,
  amount,
  memo,
  logger,
}: {
  payerUserId: UserId
  senderWalletId: WalletId
  payerUsername: Username
  recipientUsername: Username
  amount: Satoshis
  memo: string
  logger: Logger
}) => {
  const recipientUser = await UsersRepository().findByUsername(recipientUsername)
  if (recipientUser instanceof Error) return recipientUser
  if (recipientUser.id === payerUserId) return new SelfPaymentError()

  const recipientAccount = await getAccount(recipientUser.defaultAccountId)
  if (recipientAccount instanceof Error) return recipientAccount

  // TODO(nicoals): is that condition necessary? I think we want to take the position
  // that an account have, by definition, a wallet present at creation time
  if (!(recipientAccount.walletIds && recipientAccount.walletIds.length > 0)) {
    return new NoWalletExistsForUserError(recipientUsername)
  }

  const recipientWalletId = recipientAccount.defaultWalletId
  const recipientWallet = await getWallet(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet

  const paymentSendStatus = await executePaymentViaIntraledger({
    senderWalletId,
    recipientUsername,
    recipientWalletId,
    amount,
    memoPayer: memo || "",
    payerUsername,
    logger,
  })
  if (paymentSendStatus instanceof Error) return paymentSendStatus

  const addContactToPayerResult = await addNewContact({
    userId: payerUserId,
    contactUsername: recipientUsername,
  })
  if (addContactToPayerResult instanceof Error) return addContactToPayerResult

  if (payerUsername) {
    const recipientUser = await UsersRepository().findByUsername(recipientUsername)
    if (recipientUser instanceof Error) return recipientUser

    const addContactToPayeeResult = await addNewContact({
      userId: recipientUser.id,
      contactUsername: payerUsername,
    })
    if (addContactToPayeeResult instanceof Error) return addContactToPayeeResult
  }

  return paymentSendStatus
}

const executePaymentViaIntraledger = async ({
  senderWalletId,
  payerUsername,
  recipientUsername,
  recipientWalletId,
  amount,
  memoPayer,
  logger,
}: {
  senderWalletId: WalletId
  payerUsername: Username | null
  recipientUsername: Username | null
  recipientWalletId: WalletId
  amount: Satoshis
  memoPayer: string
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  if (senderWalletId === recipientWalletId) return new SelfPaymentError()

  const intraledgerLimitCheck = await checkIntraledgerLimits({
    amount,
    walletId: senderWalletId,
  })

  if (intraledgerLimitCheck instanceof Error) return intraledgerLimitCheck

  const price = await getCurrentPrice()
  if (price instanceof Error) return price
  const lnFee = toSats(0)
  const sats = toSats(amount + lnFee)
  const usd = sats * price
  const usdFee = lnFee * price

  return LockService().lockWalletId(
    { walletId: senderWalletId, logger },
    async (lock) => {
      const balance = await getBalanceForWalletId(senderWalletId)
      if (balance instanceof Error) return balance
      if (balance < sats) {
        return new InsufficientBalanceError(
          `Payment amount '${sats}' exceeds balance '${balance}'`,
        )
      }

      const journal = await LockService().extendLock({ logger, lock }, async () =>
        LedgerService().addWalletIdIntraledgerTxSend({
          senderWalletId,
          description: "",
          sats,
          fee: lnFee,
          usd,
          usdFee,
          recipientWalletId,
          payerUsername,
          recipientUsername,
          memoPayer,
        }),
      )
      if (journal instanceof Error) return journal

      const notificationsService = NotificationsService(logger)
      notificationsService.intraLedgerPaid({
        senderWalletId,
        recipientWalletId,
        amount: sats,
        usdPerSat: price,
      })

      return PaymentSendStatus.Success
    },
  )
}
