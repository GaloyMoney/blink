import { addNewContact } from "@app/accounts/add-new-contact"
import { getCurrentPrice } from "@app/prices"
import { getUser } from "@app/users"
import { getWallet } from "@app/wallets"
import { toSats } from "@domain/bitcoin"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import {
  InsufficientBalanceError,
  SatoshiAmountRequiredError,
  SelfPaymentError,
} from "@domain/errors"
import { LedgerService } from "@services/ledger"
import { LockService } from "@services"
import { AccountsRepository } from "@services/mongoose"
import { NotificationsService } from "@services/notifications"

import { checkAndVerifyTwoFA, checkIntraledgerLimits } from "./check-limit-helpers"

export const intraledgerPaymentSendUsername = async ({
  recipientUsername,
  amount,
  memo,
  senderWalletId,
  payerAccountId,
  logger,
}: IntraLedgerPaymentSendUsernameArgs): Promise<PaymentSendStatus | ApplicationError> => {
  if (!(amount && amount > 0)) {
    return new SatoshiAmountRequiredError()
  }

  const account = await AccountsRepository().findById(payerAccountId)
  if (account instanceof Error) return account

  return intraLedgerSendPaymentUsername({
    payerAccountId,
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
  payerAccountId,
  logger,
}: IntraLedgerPaymentSendWithTwoFAArgs): Promise<
  PaymentSendStatus | ApplicationError
> => {
  if (!(amount && amount > 0)) {
    return new SatoshiAmountRequiredError()
  }

  const account = await AccountsRepository().findById(payerAccountId)
  if (account instanceof Error) return account

  const user = await getUser(account.ownerId)
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

  return intraLedgerSendPaymentUsername({
    payerAccountId: user.defaultAccountId,
    senderWalletId,
    payerUsername: account.username,
    recipientUsername,
    amount,
    memo: memo || "",
    logger,
  })
}

const intraLedgerSendPaymentUsername = async ({
  payerAccountId,
  senderWalletId,
  payerUsername,
  recipientUsername,
  amount,
  memo,
  logger,
}: {
  payerAccountId: AccountId
  senderWalletId: WalletId
  payerUsername: Username
  recipientUsername: Username
  amount: Satoshis
  memo: string
  logger: Logger
}) => {
  const recipientAccount = await AccountsRepository().findByUsername(recipientUsername)
  if (recipientAccount instanceof Error) return recipientAccount
  if (recipientAccount.id === payerAccountId) return new SelfPaymentError()

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
    accountId: payerAccountId,
    contactUsername: recipientUsername,
  })
  if (addContactToPayerResult instanceof Error) return addContactToPayerResult

  if (payerUsername) {
    const recipientAccount = await AccountsRepository().findByUsername(recipientUsername)
    if (recipientAccount instanceof Error) return recipientAccount

    const addContactToPayeeResult = await addNewContact({
      accountId: recipientAccount.id,
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
      const balance = await LedgerService().getWalletBalance(senderWalletId)
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
