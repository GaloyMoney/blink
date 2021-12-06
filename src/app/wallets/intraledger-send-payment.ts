import { getCurrentPrice } from "@app/prices"
import { addNewContact } from "@app/users/add-new-contact"
import { getBalanceForWallet } from "@app/wallets"
import {
  checkAndVerifyTwoFA,
  checkIntraledgerLimits,
} from "@app/wallets/check-limit-helpers"
import { toSats } from "@domain/bitcoin"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import {
  InsufficientBalanceError,
  NoWalletExistsForUserError,
  SatoshiAmountRequiredError,
  SelfPaymentError,
} from "@domain/errors"
import { toLiabilitiesWalletId } from "@domain/ledger"
import { LedgerService } from "@services/ledger"
import { LockService } from "@services/lock"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { NotificationsService } from "@services/notifications"

export const intraledgerPaymentSendUsername = async ({
  recipientUsername,
  amount,
  memo,
  payerWalletId,
  payerUserId,
  logger,
}: IntraLedgerPaymentSendUsernameArgs): Promise<PaymentSendStatus | ApplicationError> => {
  if (!(amount && amount > 0)) {
    return new SatoshiAmountRequiredError()
  }

  const user = await UsersRepository().findById(payerUserId)
  if (user instanceof Error) return user

  const account = await AccountsRepository().findById(user.defaultAccountId)
  if (account instanceof Error) return account

  return intraLedgerSendPaymentUsername({
    payerUserId,
    payerWalletId,
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
  payerWalletId,
  logger,
}: IntraLedgerPaymentSendWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  if (!(amount && amount > 0)) {
    return new SatoshiAmountRequiredError()
  }

  if (payerWalletId === recipientWalletId) return new SelfPaymentError()

  const paymentSendStatus = await executePaymentViaIntraledger({
    payerWalletId,
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
  payerWalletId,
  payerUserId,
  logger,
}: IntraLedgerPaymentSendWithTwoFAArgs): Promise<
  PaymentSendStatus | ApplicationError
> => {
  if (!(amount && amount > 0)) {
    return new SatoshiAmountRequiredError()
  }

  const user = await UsersRepository().findById(payerUserId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const twoFACheck = twoFA?.secret
    ? await checkAndVerifyTwoFA({
        amount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        walletId: payerWalletId,
      })
    : true
  if (twoFACheck instanceof Error) return twoFACheck

  const account = await AccountsRepository().findById(user.defaultAccountId)
  if (account instanceof Error) return account

  return intraLedgerSendPaymentUsername({
    payerUserId,
    payerWalletId,
    payerUsername: account.username,
    recipientUsername,
    amount,
    memo: memo || "",
    logger,
  })
}

const intraLedgerSendPaymentUsername = async ({
  payerUserId,
  payerWalletId,
  payerUsername,
  recipientUsername,
  amount,
  memo,
  logger,
}: {
  payerUserId: UserId
  payerWalletId: WalletId
  payerUsername: Username
  recipientUsername: Username
  amount: Satoshis
  memo: string
  logger: Logger
}) => {
  const recipientUser = await UsersRepository().findByUsername(recipientUsername)
  if (recipientUser instanceof Error) return recipientUser
  if (recipientUser.id === payerUserId) return new SelfPaymentError()

  const recipientAccount = await AccountsRepository().findById(
    recipientUser.defaultAccountId,
  )
  if (recipientAccount instanceof Error) return recipientAccount
  if (!(recipientAccount.walletIds && recipientAccount.walletIds.length > 0)) {
    return new NoWalletExistsForUserError(recipientUsername)
  }

  const recipientWalletId = recipientAccount.walletIds[0]
  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet

  const paymentSendStatus = await executePaymentViaIntraledger({
    payerWalletId,
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
  payerWalletId,
  payerUsername,
  recipientUsername,
  recipientWalletId,
  amount,
  memoPayer,
  logger,
}: {
  payerWalletId: WalletId
  payerUsername: Username | null
  recipientUsername: Username | null
  recipientWalletId: WalletId
  amount: Satoshis
  memoPayer: string
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const intraledgerLimitCheck = await checkIntraledgerLimits({
    amount,
    walletId: payerWalletId,
  })

  if (intraledgerLimitCheck instanceof Error) return intraledgerLimitCheck

  const payerWallet = await WalletsRepository().findById(payerWalletId)
  if (payerWallet instanceof Error) return payerWallet

  const price = await getCurrentPrice()
  if (price instanceof Error) return price
  const lnFee = toSats(0)
  const sats = toSats(amount + lnFee)
  const usd = sats * price
  const usdFee = lnFee * price

  return LockService().lockWalletId({ walletId: payerWalletId, logger }, async (lock) => {
    const balance = await getBalanceForWallet({ walletId: payerWalletId, logger })
    if (balance instanceof Error) return balance
    if (balance < sats) {
      return new InsufficientBalanceError(
        `Payment amount '${sats}' exceeds balance '${balance}'`,
      )
    }

    const liabilitiesWalletId = toLiabilitiesWalletId(payerWalletId)
    const journal = await LockService().extendLock({ logger, lock }, async () =>
      LedgerService().addWalletIdIntraledgerTxSend({
        liabilitiesWalletId,
        description: "",
        sats,
        fee: lnFee,
        usd,
        usdFee,
        recipientLiabilitiesWalletId: toLiabilitiesWalletId(recipientWalletId),
        payerUsername,
        recipientUsername,
        memoPayer,
      }),
    )
    if (journal instanceof Error) return journal

    const notificationsService = NotificationsService(logger)
    notificationsService.intraLedgerPaid({
      payerWalletId,
      recipientWalletId,
      amount: sats,
      usdPerSat: price,
    })

    return PaymentSendStatus.Success
  })
}
