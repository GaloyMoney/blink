import { getBalanceForWallet } from "@app/wallets"
import { getTwoFALimits, getUserLimits, MS_PER_DAY } from "@config/app"
import { toMilliSats, toSats } from "@domain/bitcoin"
import {
  decodeInvoice,
  LnPaymentPendingError,
  PaymentSendStatus,
  LnFeeCalculator,
  LnAlreadyPaidError,
} from "@domain/bitcoin/lightning"
import {
  CouldNotFindError,
  InsufficientBalanceError,
  ValidationError,
} from "@domain/errors"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { LimitsChecker } from "@domain/accounts"
import { WalletInvoiceValidator } from "@domain/wallet-invoices"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { LockService } from "@services/lock"
import {
  AccountsRepository,
  UsersRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@services/mongoose"
import { RoutesRepository } from "@services/redis/routes"
import { PriceService } from "@services/price"

import * as Wallets from "@app/wallets"
import { TwoFAHelper, TwoFAError } from "@domain/twoFA"
import { addNewContact } from "@app/users/add-new-contact"

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
    return new ValidationError(error)
  }

  return lnSendPayment({
    walletId,
    userId,
    decodedInvoice,
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
    return new ValidationError(error)
  }
  if (!(amount && amount > 0)) {
    const error = "Invalid amount passed to pay zero-amount invoice"
    return new ValidationError(error)
  }

  return lnSendPayment({
    walletId,
    userId,
    decodedInvoice,
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
  paymentAmount,
  memo,
  twoFAToken,
  logger,
}: {
  walletId: WalletId
  userId: UserId
  decodedInvoice: LnInvoice
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
  if (twoFA?.secret) {
    const twoFALimitCheck = limitsChecker.checkTwoFA({
      pendingAmount: paymentAmount,
    })
    if (twoFALimitCheck instanceof Error) {
      if (!twoFAToken)
        return new TwoFAError("Need a 2FA code to proceed with the payment")
      const validTwoFA = TwoFAHelper().verify({ secret: twoFA.secret, token: twoFAToken })
      if (validTwoFA instanceof Error) return validTwoFA
    }
  }

  const lnService = LndService()
  if (lnService instanceof Error) return lnService
  const isLocal = lnService.isLocal(decodedInvoice.destination)
  if (isLocal instanceof Error) return isLocal

  return isLocal
    ? executePaymentViaIntraledger({
        paymentHash: decodedInvoice.paymentHash,
        description: decodedInvoice.description,
        paymentAmount,
        memo,
        walletId,
        userId,
        limitsChecker,
        lnService,
        logger,
      })
    : executePaymentViaLn({
        decodedInvoice,
        paymentAmount,
        walletId,
        limitsChecker,
        lnService,
        logger,
      })
}

const executePaymentViaIntraledger = async ({
  paymentHash,
  description,
  paymentAmount,
  memo,
  walletId,
  userId,
  limitsChecker,
  lnService,
  logger,
}: {
  paymentHash: PaymentHash
  description: string
  paymentAmount: Satoshis
  memo: string
  walletId: WalletId
  userId: UserId
  limitsChecker: LimitsChecker
  lnService: ILightningService
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const intraledgerLimitCheck = limitsChecker.checkIntraledger({
    pendingAmount: paymentAmount,
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

  const resultPayerAddRecipient = await addNewContact({
    userId,
    contactWalletId: recipientWalletId,
  })
  if (
    resultPayerAddRecipient instanceof Error &&
    !(resultPayerAddRecipient instanceof ValidationError)
  )
    return resultPayerAddRecipient

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
      LedgerService().sendIntraledgerTx({
        liabilitiesAccountId,
        paymentHash,
        description,
        sats,
        fee: lnFee,
        usd,
        usdFee,
        recipientLiabilitiesAccountId: toLiabilitiesAccountId(recipientWalletId),
        pubkey: lnService.defaultPubkey(),
        payerWalletName: payerWallet.walletName,
        recipientWalletName: recipientWallet.walletName,
        memoPayer: memo,
        isPushPayment: false,
      }),
    )
    if (journal instanceof Error) return journal

    const deletedLnInvoice = await lnService.deleteUnpaidInvoice({
      pubkey: recipientPubkey,
      paymentHash,
    })
    if (deletedLnInvoice instanceof Error) return deletedLnInvoice

    return PaymentSendStatus.Success
  })
}

const executePaymentViaLn = async ({
  decodedInvoice,
  paymentAmount,
  walletId,
  limitsChecker,
  lnService,
  logger,
}: {
  decodedInvoice: LnInvoice
  paymentAmount: Satoshis
  walletId: WalletId
  limitsChecker: LimitsChecker
  lnService: ILightningService
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const { paymentHash } = decodedInvoice

  const withdrawalLimitCheck = limitsChecker.checkWithdrawal({
    pendingAmount: paymentAmount,
  })
  if (withdrawalLimitCheck instanceof Error) return withdrawalLimitCheck

  const routesRepo = RoutesRepository()
  const routeResult = await routesRepo.findByPaymentHash({
    paymentHash: decodedInvoice.paymentHash,
    milliSatsAmounts: decodedInvoice.milliSatsAmount,
  })

  let route: CachedRoute | null = null
  let lndAuthForRoute: AuthenticatedLnd | null = null
  if (routeResult && !(routeResult instanceof Error)) {
    route = routeResult

    const lndAuthForRouteResult = lnService.lndFromPubkey(route.pubkey)
    if (lndAuthForRouteResult && !(lndAuthForRouteResult instanceof Error)) {
      lndAuthForRoute = lndAuthForRouteResult
    } else {
      const deleted = await routesRepo.deleteByPaymentHash({
        paymentHash: decodedInvoice.paymentHash,
        milliSatsAmounts: decodedInvoice.milliSatsAmount,
      })
      if (deleted instanceof Error) return deleted
    }
  }

  const price = await PriceService().getCurrentPrice()
  if (price instanceof Error) return price

  const maxFee = LnFeeCalculator().max(paymentAmount)
  const lnFee = route ? toSats(route.safe_fee) : maxFee
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
      LedgerService().sendLnTx({
        liabilitiesAccountId,
        paymentHash,
        description: decodedInvoice.description,
        sats,
        fee: lnFee,
        usd,
        usdFee,
        pubkey: route && lndAuthForRoute ? route.pubkey : lnService.defaultPubkey(),
        feeKnownInAdvance: !!route,
      }),
    )
    if (journal instanceof Error) return journal
    const { journalId } = journal

    const payResult = await lnService.payInvoice({
      paymentHash,
      route: !(route instanceof Error) ? route : null,
      lndAuthForRoute,
      decodedInvoice,
      milliSatsAmount: toMilliSats(paymentAmount * 1000),
      maxFee,
    })
    if (payResult instanceof LnPaymentPendingError) return PaymentSendStatus.Pending

    const ledgerService = LedgerService()
    const settled = await ledgerService.settlePendingLiabilityTransactions(paymentHash)
    if (settled instanceof Error) return settled

    if (payResult instanceof Error) {
      const voided = await ledgerService.voidLedgerTransactionsForJournal(journalId)
      if (voided instanceof Error) return voided

      if (payResult instanceof LnAlreadyPaidError) return PaymentSendStatus.AlreadyPaid

      return payResult
    }

    if (!route) {
      const reimbursed = await Wallets.reimburseFee({
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

const getLimitsChecker = async (
  walletId: WalletId,
): Promise<LimitsChecker | ApplicationError> => {
  const ledgerService = LedgerService()

  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
  const timestamp1Day = (Date.now() - MS_PER_DAY) as UnixTimeMs
  const walletVolume = await ledgerService.txVolumeSince({
    liabilitiesAccountId,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  const account = await AccountsRepository().findByWalletId(walletId)
  if (account instanceof Error) return account
  const { level } = account

  const userLimits = getUserLimits({ level })
  const twoFALimits = getTwoFALimits()
  return LimitsChecker({
    walletVolume,
    userLimits,
    twoFALimits,
  })
}
