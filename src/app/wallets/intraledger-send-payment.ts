import { addNewContact } from "@app/accounts/add-new-contact"
import { getCurrentPrice } from "@app/prices"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import { InsufficientBalanceError, SelfPaymentError } from "@domain/errors"
import { DisplayCurrencyConversionRate } from "@domain/fiat/display-currency"
import { PaymentInputValidator } from "@domain/wallets"
import { LedgerService } from "@services/ledger"
import { LockService } from "@services/lock"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { NotificationsService } from "@services/notifications"

import { checkAndVerifyTwoFA, checkIntraledgerLimits } from "./check-limit-helpers"

export const intraledgerPaymentSendUsername = async ({
  recipientUsername,
  amount,
  memo,
  senderWalletId,
  senderAccount,
  logger,
}: IntraLedgerPaymentSendUsernameArgs): Promise<PaymentSendStatus | ApplicationError> => {
  return intraLedgerSendPaymentUsername({
    senderAccount,
    senderWalletId,
    recipientUsername,
    amount,
    memo: memo || "",
    logger,
  })
}

export const intraledgerPaymentSendWalletId = async ({
  recipientWalletId,
  senderAccount,
  amount,
  memo,
  senderWalletId,
  logger,
}: IntraLedgerPaymentSendWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  return executePaymentViaIntraledger({
    senderWalletId,
    senderAccount,
    recipientUsername: null,
    recipientWalletId,
    amount,
    memoPayer: memo || "",
    logger,
  })
}

// FIXME: unused currently
export const intraledgerSendPaymentUsernameWithTwoFA = async ({
  twoFAToken,
  recipientUsername,
  senderAccount,
  amount,
  memo,
  senderWalletId,
  logger,
}: IntraLedgerPaymentSendWithTwoFAArgs): Promise<
  PaymentSendStatus | ApplicationError
> => {
  const user = await UsersRepository().findById(senderAccount.ownerId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const twoFACheck = twoFA?.secret
    ? await checkAndVerifyTwoFA({
        amount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        walletId: senderWalletId,
        account: senderAccount,
      })
    : true
  if (twoFACheck instanceof Error) return twoFACheck

  return intraLedgerSendPaymentUsername({
    senderAccount,
    senderWalletId,
    recipientUsername,
    amount,
    memo: memo || "",
    logger,
  })
}

const intraLedgerSendPaymentUsername = async ({
  senderWalletId,
  senderAccount,
  recipientUsername,
  amount,
  memo,
  logger,
}: {
  senderAccount: Account
  senderWalletId: WalletId
  recipientUsername: Username
  amount: Satoshis
  memo: string
  logger: Logger
}) => {
  const recipientAccount = await AccountsRepository().findByUsername(recipientUsername)
  if (recipientAccount instanceof Error) return recipientAccount
  if (recipientAccount.id === senderAccount.id) return new SelfPaymentError()

  const paymentSendStatus = await executePaymentViaIntraledger({
    senderWalletId,
    recipientUsername,
    recipientWalletId: recipientAccount.defaultWalletId,
    amount,
    memoPayer: memo || "",
    senderAccount,
    logger,
  })
  if (paymentSendStatus instanceof Error) return paymentSendStatus

  const addContactToPayerResult = await addNewContact({
    accountId: senderAccount.id,
    contactUsername: recipientUsername,
  })
  if (addContactToPayerResult instanceof Error) return addContactToPayerResult

  if (senderAccount.username) {
    const recipientAccount = await AccountsRepository().findByUsername(recipientUsername)
    if (recipientAccount instanceof Error) return recipientAccount

    const addContactToPayeeResult = await addNewContact({
      accountId: recipientAccount.id,
      contactUsername: senderAccount.username,
    })
    if (addContactToPayeeResult instanceof Error) return addContactToPayeeResult
  }

  return paymentSendStatus
}

const executePaymentViaIntraledger = async ({
  senderWalletId,
  senderAccount,
  recipientUsername,
  recipientWalletId,
  amount: amountRaw,
  memoPayer,
  logger,
}: {
  senderWalletId: WalletId
  senderAccount: Account
  recipientUsername: Username | null
  recipientWalletId: WalletId
  amount: Satoshis
  memoPayer: string
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const validator = PaymentInputValidator(WalletsRepository().findById)
  const validationSender = await validator.validateSender({
    amount: amountRaw,
    senderAccount,
    senderWalletId,
  })
  if (validationSender instanceof Error) return validationSender

  const { amount, senderWallet } = validationSender

  const validationRecipient = await validator.validateRecipient({
    senderWallet,
    recipientWalletId,
  })
  if (validationRecipient instanceof Error) return validationRecipient

  const { recipientWallet } = validationRecipient

  const intraledgerLimitCheck = await checkIntraledgerLimits({
    amount,
    walletId: senderWalletId,
    account: senderAccount,
  })

  if (intraledgerLimitCheck instanceof Error) return intraledgerLimitCheck

  const usdPerSat = await getCurrentPrice()
  if (usdPerSat instanceof Error) return usdPerSat

  const amountDisplayCurrency = DisplayCurrencyConversionRate(usdPerSat)(amount)

  return LockService().lockWalletId(
    { walletId: senderWalletId, logger },
    async (lock) => {
      const balance = await LedgerService().getWalletBalance(senderWalletId)
      if (balance instanceof Error) return balance
      if (balance < amount) {
        return new InsufficientBalanceError(
          `Payment amount '${amount}' exceeds balance '${balance}'`,
        )
      }

      const journal = await LockService().extendLock({ logger, lock }, async () =>
        LedgerService().addWalletIdIntraledgerTxSend({
          senderWalletId,
          senderWalletCurrency: senderWallet.currency,
          senderUsername: senderAccount.username,
          description: "",
          sats: amount,
          amountDisplayCurrency,
          recipientWalletId,
          recipientWalletCurrency: recipientWallet.currency,
          recipientUsername,
          memoPayer,
        }),
      )
      if (journal instanceof Error) return journal

      const notificationsService = NotificationsService(logger)
      notificationsService.intraLedgerPaid({
        senderWalletId,
        recipientWalletId,
        amount,
        usdPerSat,
      })

      return PaymentSendStatus.Success
    },
  )
}
