import { reimburseFee } from "@app/wallets/reimburse-fee"
import {
  checkAndVerifyTwoFA,
  checkIntraledgerLimits,
  checkWithdrawalLimits,
} from "@app/wallets/check-limit-helpers"
import { getCurrentPrice } from "@app/prices"
import { getBalanceForWallet } from "@app/wallets"

import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"
import { toMilliSatsFromNumber, toSats } from "@domain/bitcoin"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { WalletInvoiceValidator } from "@domain/wallet-invoices"

import {
  asyncRunInSpan,
  SemanticAttributes,
  addAttributesToCurrentSpan,
} from "@services/tracing"
import {
  decodeInvoice,
  LnPaymentPendingError,
  PaymentSendStatus,
  LnFeeCalculator,
  LnAlreadyPaidError,
} from "@domain/bitcoin/lightning"
import {
  AlreadyPaidError,
  InsufficientBalanceError,
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  SatoshiAmountRequiredError,
} from "@domain/errors"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { LockService } from "@services/lock"
import {
  UsersRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@services/mongoose"
import { RoutesCache } from "@services/redis/routes"

import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"
import { NotificationsService } from "@services/notifications"

export const lnInvoicePaymentSendWithTwoFA = async ({
  paymentRequest,
  memo,
  walletId,
  userId,
  twoFAToken,
  logger,
}: LnInvoicePaymentSendWithTwoFAArgs): Promise<PaymentSendStatus | ApplicationError> =>
  asyncRunInSpan(
    "app.lnInvoicePaymentSendWithTwoFA",
    {
      [SemanticAttributes.CODE_FUNCTION]: "lnInvoicePaymentSendWithTwoFA",
      "payment.initiation_method": PaymentInitiationMethod.Lightning,
      "payment.wallet_id": walletId,
      "payment.request": paymentRequest,
    },
    async () => {
      const decodedInvoice = decodeInvoice(paymentRequest)
      if (decodedInvoice instanceof Error) return decodedInvoice

      const { amount: lnInvoiceAmount } = decodedInvoice
      if (!(lnInvoiceAmount && lnInvoiceAmount > 0)) {
        return new LnPaymentRequestNonZeroAmountRequiredError()
      }

      const user = await UsersRepository().findById(userId)
      if (user instanceof Error) return user
      const { username, twoFA } = user

      const twoFACheck = twoFA?.secret
        ? await checkAndVerifyTwoFA({
            amount: lnInvoiceAmount,
            twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
            twoFASecret: twoFA.secret,
            walletId,
          })
        : true
      if (twoFACheck instanceof Error) return twoFACheck

      return lnSendPayment({
        walletId,
        username,
        decodedInvoice,
        amount: lnInvoiceAmount,
        memo: memo || "",
        logger,
      })
    },
  )

export const payLnInvoiceByWalletPublicId = async ({
  walletPublicId,
  paymentRequest,
  memo,
  userId,
  logger,
}: PayLnInvoiceByWalletPublicIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findByPublicId(walletPublicId)
  if (wallet instanceof Error) return wallet

  return lnInvoicePaymentSend({
    walletId: wallet.id,
    paymentRequest,
    memo,
    userId,
    logger,
  })
}

export const lnInvoicePaymentSend = async ({
  paymentRequest,
  memo,
  walletId,
  userId,
  logger,
}: LnInvoicePaymentSendArgs): Promise<PaymentSendStatus | ApplicationError> =>
  asyncRunInSpan(
    "app.lnInvoicePaymentSend",
    {
      [SemanticAttributes.CODE_FUNCTION]: "lnInvoicePaymentSend",
      "payment.initiation_method": PaymentInitiationMethod.Lightning,
      "payment.wallet_id": walletId,
      "payment.request": paymentRequest,
    },
    async () => {
      const decodedInvoice = decodeInvoice(paymentRequest)
      if (decodedInvoice instanceof Error) return decodedInvoice

      const { amount: lnInvoiceAmount } = decodedInvoice
      if (!(lnInvoiceAmount && lnInvoiceAmount > 0)) {
        return new LnPaymentRequestNonZeroAmountRequiredError()
      }

      const user = await UsersRepository().findById(userId)
      if (user instanceof Error) return user

      return lnSendPayment({
        walletId,
        username: user.username,
        decodedInvoice,
        amount: lnInvoiceAmount,
        memo: memo || "",
        logger,
      })
    },
  )

export const lnNoAmountInvoicePaymentSendWithTwoFA = async ({
  paymentRequest,
  amount,
  memo,
  walletId,
  userId,
  twoFAToken,
  logger,
}: LnNoAmountInvoicePaymentSendWithTwoFAArgs): Promise<
  PaymentSendStatus | ApplicationError
> =>
  asyncRunInSpan(
    "app.lnNoAmountInvoicePaymentSendWithTwoFA",
    {
      [SemanticAttributes.CODE_FUNCTION]: "lnNoAmountInvoicePaymentSendWithTwoFA",
      "payment.initiation_method": PaymentInitiationMethod.Lightning,
      "payment.wallet_id": walletId,
      "payment.request": paymentRequest,
      "payment.amount": amount,
    },
    async () => {
      const decodedInvoice = decodeInvoice(paymentRequest)
      if (decodedInvoice instanceof Error) return decodedInvoice

      const { amount: lnInvoiceAmount } = decodedInvoice
      if (lnInvoiceAmount && lnInvoiceAmount > 0) {
        return new LnPaymentRequestZeroAmountRequiredError()
      }

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
        walletId,
        username,
        decodedInvoice,
        amount,
        memo: memo || "",
        logger,
      })
    },
  )

export const payLnNoAmountInvoiceByWalletPublicId = async ({
  walletPublicId,
  paymentRequest,
  amount,
  memo,
  userId,
  logger,
}: PayLnNoAmountInvoiceByWalletPublicIdArgs): Promise<
  PaymentSendStatus | ApplicationError
> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findByPublicId(walletPublicId)
  if (wallet instanceof Error) return wallet

  return lnNoAmountInvoicePaymentSend({
    walletId: wallet.id,
    paymentRequest,
    amount,
    memo,
    userId,
    logger,
  })
}

export const lnNoAmountInvoicePaymentSend = async ({
  paymentRequest,
  amount,
  memo,
  walletId,
  userId,
  logger,
}: LnNoAmountInvoicePaymentSendArgs): Promise<PaymentSendStatus | ApplicationError> =>
  asyncRunInSpan(
    "app.lnNoAmountInvoicePaymentSend",
    {
      [SemanticAttributes.CODE_FUNCTION]: "lnNoAmountInvoicePaymentSend",
      "payment.initiation_method": PaymentInitiationMethod.Lightning,
      "payment.wallet_id": walletId,
      "payment.request": paymentRequest,
      "payment.amount": amount,
    },
    async () => {
      const decodedInvoice = decodeInvoice(paymentRequest)
      if (decodedInvoice instanceof Error) return decodedInvoice

      const { amount: lnInvoiceAmount } = decodedInvoice
      if (lnInvoiceAmount && lnInvoiceAmount > 0) {
        return new LnPaymentRequestZeroAmountRequiredError()
      }

      if (!(amount && amount > 0)) {
        return new SatoshiAmountRequiredError()
      }

      const user = await UsersRepository().findById(userId)
      if (user instanceof Error) return user

      return lnSendPayment({
        walletId,
        username: user.username,
        decodedInvoice,
        amount,
        memo: memo || "",
        logger,
      })
    },
  )

const lnSendPayment = async ({
  walletId,
  username,
  decodedInvoice,
  amount,
  memo,
  logger,
}: {
  walletId: WalletId
  username: Username
  decodedInvoice: LnInvoice
  amount: Satoshis
  memo: string
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.amount": amount,
    "payment.request.destination": decodedInvoice.destination,
    "payment.request.hash": decodedInvoice.paymentHash,
    "payment.request.description": decodedInvoice.description,
  })
  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const isLocal = lndService.isLocal(decodedInvoice.destination)
  if (isLocal instanceof Error) return isLocal
  const usdPerSat = await getCurrentPrice()
  if (usdPerSat instanceof Error) return usdPerSat

  if (isLocal) {
    const executedPayment = await executePaymentViaIntraledger({
      paymentHash: decodedInvoice.paymentHash,
      description: decodedInvoice.description,
      amount,
      usdPerSat,
      memo,
      payerWalletId: walletId,
      payerUsername: username,
      lndService,
      logger,
    })

    return executedPayment
  }

  return executePaymentViaLn({
    decodedInvoice,
    amount,
    usdPerSat,
    walletId,
    lndService,
    logger,
  })
}

const executePaymentViaIntraledger = async ({
  paymentHash,
  description,
  amount,
  usdPerSat,
  memo,
  payerWalletId,
  payerUsername,
  lndService,
  logger,
}: {
  paymentHash: PaymentHash
  description: string
  amount: Satoshis
  usdPerSat: UsdPerSat
  memo: string
  payerWalletId: WalletId
  payerUsername: Username
  lndService: ILightningService
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.IntraLedger,
  })
  const intraledgerLimitCheck = await checkIntraledgerLimits({
    amount,
    walletId: payerWalletId,
  })
  if (intraledgerLimitCheck instanceof Error) return intraledgerLimitCheck

  const invoicesRepo = WalletInvoicesRepository()
  const walletInvoice = await invoicesRepo.findByPaymentHash(paymentHash)
  if (walletInvoice instanceof Error) return walletInvoice

  const validatedResult = WalletInvoiceValidator(walletInvoice).validateToSend({
    fromWalletId: payerWalletId,
  })
  if (validatedResult instanceof AlreadyPaidError) return PaymentSendStatus.AlreadyPaid
  if (validatedResult instanceof Error) return validatedResult
  const { pubkey: recipientPubkey, walletId: recipientWalletId } = walletInvoice

  const payerWallet = await WalletsRepository().findById(payerWalletId)
  if (payerWallet instanceof Error) return payerWallet
  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet

  const lnFee = toSats(0)
  const sats = toSats(amount + lnFee)
  const usd = sats * usdPerSat
  const usdFee = lnFee * usdPerSat

  return LockService().lockWalletId({ walletId: payerWalletId, logger }, async (lock) => {
    const balance = await getBalanceForWallet({ walletId: payerWalletId, logger })
    if (balance instanceof Error) return balance
    if (balance < sats) {
      return new InsufficientBalanceError(
        `Payment amount '${sats}' exceeds balance '${balance}'`,
      )
    }

    const liabilitiesAccountId = toLiabilitiesAccountId(payerWalletId)
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
        payerUsername,
        recipientUsername: null,
        memoPayer: memo,
      }),
    )
    if (journal instanceof Error) return journal

    const deletedLnInvoice = await lndService.cancelInvoice({
      pubkey: recipientPubkey,
      paymentHash,
    })
    if (deletedLnInvoice instanceof Error) return deletedLnInvoice

    walletInvoice.paid = true
    const updatedWalletInvoice = await invoicesRepo.update(walletInvoice)
    if (updatedWalletInvoice instanceof Error) return updatedWalletInvoice

    const notificationsService = NotificationsService(logger)
    notificationsService.lnInvoicePaid({
      paymentHash,
      recipientWalletId,
      payerWalletId,
      amount,
      usdPerSat,
    })

    return PaymentSendStatus.Success
  })
}

const executePaymentViaLn = async ({
  decodedInvoice,
  amount,
  usdPerSat,
  walletId,
  lndService,
  logger,
}: {
  decodedInvoice: LnInvoice
  amount: Satoshis
  usdPerSat: UsdPerSat
  walletId: WalletId
  lndService: ILightningService
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.Lightning,
  })
  const { paymentHash } = decodedInvoice

  const withdrawalLimitCheck = await checkWithdrawalLimits({
    amount,
    walletId,
  })
  if (withdrawalLimitCheck instanceof Error) return withdrawalLimitCheck

  const key = CachedRouteLookupKeyFactory().create({
    paymentHash: decodedInvoice.paymentHash,
    milliSats: decodedInvoice.milliSatsAmount,
  })
  const routesCache = RoutesCache()
  const cachedRoute = await routesCache.findByKey(key)

  let pubkey = lndService.defaultPubkey()
  let rawRoute: RawRoute | null = null
  let route: Route | null = null
  if (cachedRoute && !(cachedRoute instanceof Error)) {
    ;({ pubkey, route: rawRoute } = cachedRoute)
    route = {
      roundedUpFee: toSats(rawRoute.safe_fee),
      roundedDownFee: toSats(rawRoute.fee),
    }
  }

  const maxFee = LnFeeCalculator().max(amount)
  const lnFee = route ? route.roundedUpFee : maxFee
  const sats = toSats(amount + lnFee)
  const usd = sats * usdPerSat
  const usdFee = lnFee * usdPerSat

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

    const payResult = rawRoute
      ? await lndService.payInvoiceViaRoutes({
          paymentHash,
          rawRoute,
          pubkey,
        })
      : await lndService.payInvoiceViaPaymentDetails({
          decodedInvoice,
          milliSatsAmount: toMilliSatsFromNumber(amount * 1000),
          maxFee,
        })
    if (payResult instanceof LnPaymentPendingError) return PaymentSendStatus.Pending

    const settled = await ledgerService.settlePendingLnPayments(paymentHash)
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
