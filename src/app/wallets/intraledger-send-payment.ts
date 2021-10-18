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
import { toLiabilitiesAccountId } from "@domain/ledger"
import { LedgerService } from "@services/ledger"
import { LockService } from "@services/lock"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { PriceService } from "@services/price"

export const intraledgerPaymentSend = async ({
  recipientUsername,
  amount,
  memo,
  walletId,
  userId,
  logger,
}: IntraLedgerPaymentSendArgs): Promise<PaymentSendStatus | ApplicationError> => {
  if (!(amount && amount > 0)) {
    return new SatoshiAmountRequiredError()
  }

  const user = await UsersRepository().findById(userId)
  if (user instanceof Error) return user

  return lnSendPayment({
    userId,
    walletId,
    username: user.username,
    recipientUsername,
    amount,
    memo: memo || "",
    logger,
  })
}

export const intraledgerSendPaymentWithTwoFA = async ({
  twoFAToken,
  recipientUsername,
  amount,
  memo,
  walletId,
  userId,
  logger,
}: IntraLedgerPaymentSendWithTwoFAArgs): Promise<
  PaymentSendStatus | ApplicationError
> => {
  if (!(amount && amount > 0)) {
    return new SatoshiAmountRequiredError()
  }

  const user = await UsersRepository().findById(userId)
  if (user instanceof Error) return user
  const { username, twoFA } = user

  const twoFACheck = twoFA?.secret
    ? await checkAndVerifyTwoFA({
        amount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        walletId,
      })
    : true
  if (twoFACheck instanceof Error) return twoFACheck

  return lnSendPayment({
    userId,
    walletId,
    username,
    recipientUsername,
    amount,
    memo: memo || "",
    logger,
  })
}

const lnSendPayment = async ({
  userId,
  walletId,
  username,
  recipientUsername,
  amount,
  memo,
  logger,
}: {
  userId: UserId
  walletId: WalletId
  username: Username
  recipientUsername: Username
  amount: Satoshis
  memo: string
  logger: Logger
}) => {
  const paymentSendStatus = await executePaymentViaIntraledger({
    userId,
    recipientUsername,
    amount,
    memoPayer: memo || "",
    walletId,
    username,
    logger,
  })

  const addContactToPayerResult = await addNewContact({
    userId,
    contactUsername: recipientUsername,
  })
  if (addContactToPayerResult instanceof Error) return addContactToPayerResult

  if (username) {
    const recipientUser = await UsersRepository().findByUsername(recipientUsername)
    if (recipientUser instanceof Error) return recipientUser

    const addContactToPayeeResult = await addNewContact({
      userId: recipientUser.id,
      contactUsername: username,
    })
    if (addContactToPayeeResult instanceof Error) return addContactToPayeeResult
  }

  return paymentSendStatus
}

const executePaymentViaIntraledger = async ({
  userId,
  recipientUsername,
  amount,
  memoPayer,
  walletId,
  username,
  logger,
}: {
  userId: UserId
  recipientUsername: Username
  amount: Satoshis
  memoPayer: string
  walletId: WalletId
  username: Username
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const intraledgerLimitCheck = await checkIntraledgerLimits({
    amount,
    walletId,
  })
  if (intraledgerLimitCheck instanceof Error) return intraledgerLimitCheck

  const recipientUser = await UsersRepository().findByUsername(recipientUsername)
  if (recipientUser instanceof Error) return recipientUser
  if (recipientUser.id === userId) return new SelfPaymentError()

  const recipientAccount = await AccountsRepository().findById(
    recipientUser.defaultAccountId,
  )
  if (recipientAccount instanceof Error) return recipientAccount
  if (!(recipientAccount.walletIds && recipientAccount.walletIds.length > 0)) {
    return new NoWalletExistsForUserError(recipientUsername)
  }
  const recipientWalletId = recipientAccount.walletIds[0]

  const payerWallet = await WalletsRepository().findById(walletId)
  if (payerWallet instanceof Error) return payerWallet
  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet

  const price = await PriceService().getCurrentPrice()
  if (price instanceof Error) return price
  const lnFee = toSats(0)
  const sats = toSats(amount + lnFee)
  const usd = sats * price
  const usdFee = lnFee * price

  return LockService().lockWalletId({ walletId, logger }, async (lock) => {
    const balance = await getBalanceForWallet({ walletId, logger })
    if (balance instanceof Error) return balance
    if (balance < sats) {
      return new InsufficientBalanceError(
        `Payment amount '${sats}' exceeds balance '${balance}'`,
      )
    }

    const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
    const journal = await LockService().extendLock({ logger, lock }, async () =>
      LedgerService().addUsernameIntraledgerTxSend({
        liabilitiesAccountId,
        description: "",
        sats,
        fee: lnFee,
        usd,
        usdFee,
        recipientLiabilitiesAccountId: toLiabilitiesAccountId(recipientWalletId),
        payerUsername: username,
        recipientUsername,
        payerWalletPublicId: payerWallet.publicId,
        recipientWalletPublicId: recipientWallet.publicId,
        memoPayer,
      }),
    )
    if (journal instanceof Error) return journal

    return PaymentSendStatus.Success
  })
}
