import { getBalanceForWallet } from "@app/wallets"
import { toMilliSatsFromNumber, toSats } from "@domain/bitcoin"
import {
  decodeInvoice,
  LnPaymentPendingError,
  PaymentSendStatus,
  LnFeeCalculator,
  LnAlreadyPaidError,
  NoValidNodeForPubkeyError,
} from "@domain/bitcoin/lightning"
import {
  CouldNotFindError,
  IncorrectUseCaseError,
  InsufficientBalanceError,
  InvalidSatoshiAmount,
} from "@domain/errors"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { WalletInvoiceValidator } from "@domain/wallet-invoices"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { LockService } from "@services/lock"
import {
  UsersRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@services/mongoose"
import { RoutesCache } from "@services/redis/routes"
import { PriceService } from "@services/price"

import { reimburseFee } from "@app/wallets/reimburse-fee"
import { TwoFAError, TwoFANewCodeNeededError } from "@domain/twoFA"
import { checkAndVerifyTwoFA, getLimitsChecker } from "@core/accounts/helpers"
import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"
import { lnPaymentStatusEvent } from "@config/app"
import { NotificationsService } from "@services/notifications"
import pubsub from "@services/pubsub"

export const lnInvoicePaymentSend = async (
  args: LnInvoicePaymentSendArgs,
): Promise<PaymentSendStatus | ApplicationError> =>
  lnInvoicePaymentSendWithTwoFA({
    twoFAToken: null,
    ...args,
  })

export const lnNoAmountInvoicePaymentSend = async (
  args: LnNoAmountInvoicePaymentSendArgs,
): Promise<PaymentSendStatus | ApplicationError> =>
  lnNoAmountInvoicePaymentSendWithTwoFA({
    twoFAToken: null,
    ...args,
  })

export const lnInvoicePaymentSendWithTwoFA = async ({
  paymentRequest,
  memo,
  walletId,
  userId,
  twoFAToken,
  logger,
}: LnInvoicePaymentSendWithTwoFAArgs): Promise<PaymentSendStatus | ApplicationError> => {
  const decodedInvoice = await decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: paymentAmount } = decodedInvoice
  if (!(paymentAmount && paymentAmount > 0)) {
    const error = "Zero-amount invoice cannot be paid using this use-case method"
    return new IncorrectUseCaseError(error)
  }

  return lnSendPayment({
    walletId,
    userId,
    decodedInvoice,
    paymentRequest,
    paymentAmount,
    memo: memo || "",
    twoFAToken,
    logger,
  })
}

export const lnNoAmountInvoicePaymentSendWithTwoFA = async ({
  paymentRequest,
  memo,
  amount,
  walletId,
  userId,
  twoFAToken,
  logger,
}: LnNoAmountInvoicePaymentSendWithTwoFAArgs): Promise<
  PaymentSendStatus | ApplicationError
> => {
  const decodedInvoice = await decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (lnInvoiceAmount && lnInvoiceAmount > 0) {
    const error = "Non zero-amount invoice cannot be paid using this use-case method"
    return new IncorrectUseCaseError(error)
  }
  if (!(amount && amount > 0)) {
    const error = "Invalid amount passed to pay zero-amount invoice"
    return new InvalidSatoshiAmount(error)
  }

  return lnSendPayment({
    walletId,
    userId,
    decodedInvoice,
    paymentRequest,
    paymentAmount: amount,
    memo: memo || "",
    twoFAToken,
    logger,
  })
}

const lnSendPayment = async ({
  walletId,
  userId,
  decodedInvoice,
  paymentRequest,
  paymentAmount,
  memo,
  twoFAToken,
  logger,
}: {
  walletId: WalletId
  userId: UserId
  decodedInvoice: LnInvoice
  paymentRequest: EncodedPaymentRequest
  paymentAmount: Satoshis
  memo: string
  twoFAToken: TwoFAToken | null
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const limitsChecker = await getLimitsChecker(walletId)
  if (limitsChecker instanceof Error) return limitsChecker

  const user = await UsersRepository().findById(userId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const twoFACheck = twoFA?.secret
    ? await checkAndVerifyTwoFA({
        amount: paymentAmount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        limitsChecker: limitsChecker,
      })
    : true
  if (twoFACheck instanceof TwoFANewCodeNeededError)
    return new TwoFAError("Need a 2FA code to proceed with the payment")
  if (twoFACheck instanceof Error) return twoFACheck

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const isLocal = lndService.isLocal(decodedInvoice.destination)
  if (isLocal instanceof Error) return isLocal

  if (isLocal) {
    const executedPayment = await executePaymentViaIntraledger({
      paymentHash: decodedInvoice.paymentHash,
      description: decodedInvoice.description,
      paymentAmount,
      memo,
      walletId,
      username: user.username,
      limitsChecker,
      lndService,
      logger,
    })
    if (executedPayment === PaymentSendStatus.Success) {
      const notificationsService = NotificationsService(logger)
      await notificationsService.lnPaymentReceived({
        amount: paymentAmount,
        walletId,
        paymentHash: decodedInvoice.paymentHash,
      })

      const eventName = lnPaymentStatusEvent(decodedInvoice.paymentHash)
      pubsub.publish(eventName, { status: "PAID" })
    }

    return executedPayment
  }

  return executePaymentViaLn({
    decodedInvoice,
    paymentRequest,
    paymentAmount,
    walletId,
    limitsChecker,
    lndService,
    logger,
  })
}

const executePaymentViaIntraledger = async ({
  paymentHash,
  description,
  paymentAmount,
  memo,
  walletId,
  username,
  limitsChecker,
  lndService,
  logger,
}: {
  paymentHash: PaymentHash
  description: string
  paymentAmount: Satoshis
  memo: string
  walletId: WalletId
  username: Username
  limitsChecker: LimitsChecker
  lndService: ILightningService
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const intraledgerLimitCheck = limitsChecker.checkIntraledger({
    amount: paymentAmount,
  })
  if (intraledgerLimitCheck instanceof Error) return intraledgerLimitCheck

  const invoicesRepo = WalletInvoicesRepository()
  const walletInvoice = await invoicesRepo.findByPaymentHash(paymentHash)
  if (walletInvoice instanceof CouldNotFindError) {
    const error = `User tried to pay invoice generated by a Galoy user, but the invoice does not exist`
    return new CouldNotFindError(error)
  }
  if (walletInvoice instanceof Error) return walletInvoice

  const validatedResult = WalletInvoiceValidator(walletInvoice).validateToSend({
    fromWalletId: walletId,
  })
  if (validatedResult instanceof Error) return validatedResult
  const { pubkey: recipientPubkey, walletId: recipientWalletId } = walletInvoice

  const payerWallet = await WalletsRepository().findById(walletId)
  if (payerWallet instanceof CouldNotFindError) return payerWallet
  if (payerWallet instanceof Error) return payerWallet
  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof CouldNotFindError) return recipientWallet
  if (recipientWallet instanceof Error) return recipientWallet

  const price = await PriceService().getCurrentPrice()
  if (price instanceof Error) return price
  const lnFee = toSats(0)
  const sats = toSats(paymentAmount + lnFee)
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
      LedgerService().addLnIntraledgerTxSend({
        liabilitiesAccountId,
        paymentHash,
        description,
        sats,
        fee: lnFee,
        usd,
        usdFee,
        recipientLiabilitiesAccountId: toLiabilitiesAccountId(recipientWalletId),
        pubkey: lndService.defaultPubkey(),
        payerUsername: username,
        recipientUsername: null,
        payerWalletPublicId: payerWallet.publicId,
        recipientWalletPublicId: recipientWallet.publicId,
        memoPayer: memo,
      }),
    )
    if (journal instanceof Error) return journal

    const deletedLnInvoice = await lndService.cancelInvoice({
      pubkey: recipientPubkey,
      paymentHash,
    })
    if (deletedLnInvoice instanceof Error) return deletedLnInvoice

    return PaymentSendStatus.Success
  })
}

const executePaymentViaLn = async ({
  decodedInvoice,
  paymentRequest,
  paymentAmount,
  walletId,
  limitsChecker,
  lndService,
  logger,
}: {
  decodedInvoice: LnInvoice
  paymentRequest: EncodedPaymentRequest
  paymentAmount: Satoshis
  walletId: WalletId
  limitsChecker: LimitsChecker
  lndService: ILightningService
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const { paymentHash } = decodedInvoice

  const withdrawalLimitCheck = limitsChecker.checkWithdrawal({
    amount: paymentAmount,
  })
  if (withdrawalLimitCheck instanceof Error) return withdrawalLimitCheck

  const key = CachedRouteLookupKeyFactory().create({
    paymentHash: decodedInvoice.paymentHash,
    milliSats: decodedInvoice.milliSatsAmount,
  })
  const routesCache = RoutesCache()
  const cachedRoute = await routesCache.findByKey(key)

  let pubkey: Pubkey
  let rawRoute: RawRoute | null = null
  let route: Route | null = null
  if (cachedRoute && !(cachedRoute instanceof Error)) {
    ;({ pubkey, route: rawRoute } = cachedRoute)
    route = {
      roundedUpFee: toSats(rawRoute.safe_fee),
      roundedDownFee: toSats(rawRoute.fee),
    }
  } else {
    pubkey = lndService.defaultPubkey()
  }

  const price = await PriceService().getCurrentPrice()
  if (price instanceof Error) return price

  const maxFee = LnFeeCalculator().max(paymentAmount)
  const lnFee = route ? toSats(route.roundedUpFee) : maxFee
  const sats = toSats(paymentAmount + lnFee)
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

    const ledgerService = LedgerService()
    const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
    const journal = await LockService().extendLock({ logger, lock }, async () =>
      ledgerService.addLnTxSend({
        liabilitiesAccountId,
        paymentHash,
        description: decodedInvoice.description,
        sats,
        fee: lnFee,
        usd,
        usdFee,
        pubkey,
        feeKnownInAdvance: !!rawRoute,
      }),
    )
    if (journal instanceof Error) return journal
    const { journalId } = journal

    let payResult: PayInvoiceResult | LightningServiceError
    if (rawRoute) {
      payResult = await lndService.payInvoiceViaRoutes({
        paymentHash,
        rawRoute,
        pubkey,
      })

      if (payResult instanceof NoValidNodeForPubkeyError) {
        pubkey = lndService.defaultPubkey()
        const payment = await lndService.lookupPayment({ pubkey, paymentHash })
        if (payment instanceof Error) return payment
        payment.paymentRequest = payment.paymentRequest || paymentRequest
        const updated = await ledgerService.updatePendingLnPayments({
          paymentHash,
          pubkey,
          payment,
        })
        if (updated instanceof Error) return updated

        const deleted = await routesCache.deleteByKey(key)
        if (deleted instanceof Error) return deleted

        payResult = await lndService.payInvoiceViaPaymentDetails({
          decodedInvoice,
          milliSatsAmount: toMilliSatsFromNumber(paymentAmount * 1000),
          maxFee,
        })
      }
    } else {
      payResult = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice,
        milliSatsAmount: toMilliSatsFromNumber(paymentAmount * 1000),
        maxFee,
      })
    }
    if (payResult instanceof LnPaymentPendingError) return PaymentSendStatus.Pending

    const payment = await lndService.lookupPayment({ pubkey, paymentHash })
    if (payment instanceof Error) return payment
    payment.paymentRequest = payment.paymentRequest || paymentRequest

    console.log("HERE 10:", paymentHash)
    console.log("HERE 11:", payment)
    const settled = await ledgerService.settlePendingLnPayments({ paymentHash, payment })
    if (settled instanceof Error) return settled

    if (payResult instanceof Error) {
      const voided = await ledgerService.voidLedgerTransactionsForJournal(journalId)
      if (voided instanceof Error) return voided

      if (payResult instanceof LnAlreadyPaidError) return PaymentSendStatus.AlreadyPaid

      return payResult
    }

    if (!rawRoute) {
      const reimbursed = await reimburseFee({
        liabilitiesAccountId,
        journalId,
        paymentHash,
        maxFee,
        actualFee: payResult.roundedUpFee,
        logger,
      })
      if (reimbursed instanceof Error) return reimbursed
    }

    return PaymentSendStatus.Success
  })
}
