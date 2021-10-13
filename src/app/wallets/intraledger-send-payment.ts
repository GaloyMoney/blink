import { addNewContact } from "@app/users/add-new-contact"
import { getBalanceForWallet } from "@app/wallets"
import { checkAndVerifyTwoFA, checkIntraledgerLimits } from "@core/accounts/helpers"
import { toSats } from "@domain/bitcoin"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import {
  CouldNotFindError,
  InsufficientBalanceError,
  NoUserForUsernameError,
  NoWalletExistsForUserError,
  SatoshiAmountRequiredError,
  SelfPaymentError,
} from "@domain/errors"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { TwoFAError, TwoFANewCodeNeededError } from "@domain/twoFA"
import { LedgerService } from "@services/ledger"
import { LockService } from "@services/lock"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { PriceService } from "@services/price"

export const intraledgerPaymentSend = async (
  args: IntraLedgerPaymentSendArgs,
): Promise<PaymentSendStatus | ApplicationError> =>
  intraledgerSendPaymentWithTwoFA({
    twoFAToken: null,
    ...args,
  })

const intraledgerSendPaymentWithTwoFA = async ({
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
  const { twoFA } = user

  const twoFACheck = twoFA?.secret
    ? await checkAndVerifyTwoFA({
        amount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        walletId,
      })
    : true
  if (twoFACheck instanceof TwoFANewCodeNeededError)
    return new TwoFAError("Need a 2FA code to proceed with the payment")
  if (twoFACheck instanceof Error) return twoFACheck

  const paymentSendStatus = await executePaymentViaIntraledger({
    userId,
    recipientUsername,
    amount,
    memoPayer: memo || "",
    walletId,
    username: user.username,
    logger,
  })

  const addContactToPayerResult = await addNewContact({
    userId,
    contactUsername: recipientUsername,
  })
  if (addContactToPayerResult instanceof Error) return addContactToPayerResult

  if (user.username) {
    const recipientUser = await UsersRepository().findByUsername(recipientUsername)
    if (recipientUser instanceof Error) return recipientUser

    const addContactToPayeeResult = await addNewContact({
      userId: recipientUser.id,
      contactUsername: user.username,
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
  if (recipientUser instanceof CouldNotFindError)
    return new NoUserForUsernameError(recipientUsername)
  if (recipientUser instanceof Error) return recipientUser
  if (recipientUser.id === userId)
    return new SelfPaymentError("User tried to pay themselves")

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
