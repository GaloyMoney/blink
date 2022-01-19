import { getCurrentPrice } from "@app/prices"
import { getUser } from "@app/users"
import { getBalanceForWalletId, getWallet } from "@app/wallets"
import {
  checkAndVerifyTwoFA,
  checkIntraledgerLimits,
  checkWithdrawalLimits,
} from "@app/wallets/check-limit-helpers"
import { reimburseFee } from "@app/wallets/reimburse-fee"
import { toMilliSatsFromNumber, toSats } from "@domain/bitcoin"
import {
  decodeInvoice,
  LnAlreadyPaidError,
  LnFeeCalculator,
  LnPaymentPendingError,
  PaymentSendStatus,
} from "@domain/bitcoin/lightning"
import {
  AlreadyPaidError,
  InsufficientBalanceError,
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  SatoshiAmountRequiredError,
} from "@domain/errors"
import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"
import { WalletInvoiceValidator } from "@domain/wallet-invoices"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { LockService } from "@services/lock"
import { WalletInvoicesRepository, AccountsRepository } from "@services/mongoose"
import { NotificationsService } from "@services/notifications"
import { RoutesCache } from "@services/redis/routes"
import { addAttributesToCurrentSpan } from "@services/tracing"

export const lnInvoicePaymentSendWithTwoFA = async ({
  paymentRequest,
  memo,
  senderWalletId,
  payerAccountId,
  twoFAToken,
  logger,
}: LnInvoicePaymentSendWithTwoFAArgs): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })

  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (!(lnInvoiceAmount && lnInvoiceAmount > 0)) {
    return new LnPaymentRequestNonZeroAmountRequiredError()
  }

  const account = await AccountsRepository().findById(payerAccountId)

  if (account instanceof Error) return account

  const user = await getUser(account.ownerId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const { username } = account

  const twoFACheck = twoFA?.secret
    ? await checkAndVerifyTwoFA({
        amount: lnInvoiceAmount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        walletId: senderWalletId,
      })
    : true
  if (twoFACheck instanceof Error) return twoFACheck

  return lnSendPayment({
    senderWalletId,
    username,
    decodedInvoice,
    amount: lnInvoiceAmount,
    memo: memo || "",
    logger,
  })
}

export const payLnInvoiceByWalletId = async ({
  senderWalletId,
  paymentRequest,
  memo,
  payerAccountId,
  logger,
}: PayLnInvoiceByWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  return lnInvoicePaymentSend({
    senderWalletId,
    paymentRequest,
    memo,
    payerAccountId,
    logger,
  })
}

export const lnInvoicePaymentSend = async ({
  paymentRequest,
  memo,
  senderWalletId,
  payerAccountId,
  logger,
}: LnInvoicePaymentSendArgs): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })

  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (!(lnInvoiceAmount && lnInvoiceAmount > 0)) {
    return new LnPaymentRequestNonZeroAmountRequiredError()
  }

  const account = await AccountsRepository().findById(payerAccountId)
  if (account instanceof Error) return account

  const { username } = account

  return lnSendPayment({
    senderWalletId,
    username,
    decodedInvoice,
    amount: lnInvoiceAmount,
    memo: memo || "",
    logger,
  })
}

export const lnNoAmountInvoicePaymentSendWithTwoFA = async ({
  paymentRequest,
  amount,
  memo,
  senderWalletId,
  payerAccountId,
  twoFAToken,
  logger,
}: LnNoAmountInvoicePaymentSendWithTwoFAArgs): Promise<
  PaymentSendStatus | ApplicationError
> => {
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })

  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (lnInvoiceAmount && lnInvoiceAmount > 0) {
    return new LnPaymentRequestZeroAmountRequiredError()
  }

  if (!(amount && amount > 0)) {
    return new SatoshiAmountRequiredError()
  }

  const account = await AccountsRepository().findById(payerAccountId)

  if (account instanceof Error) return account

  const user = await getUser(account.ownerId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const { username } = account

  const twoFACheck = twoFA?.secret
    ? await checkAndVerifyTwoFA({
        amount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        walletId: senderWalletId,
      })
    : true
  if (twoFACheck instanceof Error) return twoFACheck

  return lnSendPayment({
    senderWalletId,
    username,
    decodedInvoice,
    amount,
    memo: memo || "",
    logger,
  })
}

export const payLnNoAmountInvoiceByWalletId = async ({
  senderWalletId,
  paymentRequest,
  amount,
  memo,
  payerAccountId,
  logger,
}: payLnNoAmountInvoiceByWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  return lnNoAmountInvoicePaymentSend({
    senderWalletId,
    paymentRequest,
    amount,
    memo,
    payerAccountId,
    logger,
  })
}

export const lnNoAmountInvoicePaymentSend = async ({
  paymentRequest,
  amount,
  memo,
  senderWalletId,
  payerAccountId,
  logger,
}: LnNoAmountInvoicePaymentSendArgs): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })

  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (lnInvoiceAmount && lnInvoiceAmount > 0) {
    return new LnPaymentRequestZeroAmountRequiredError()
  }

  const account = await AccountsRepository().findById(payerAccountId)
  if (account instanceof Error) return account

  const { username } = account

  return lnSendPayment({
    senderWalletId,
    username,
    decodedInvoice,
    amount,
    memo: memo || "",
    logger,
  })
}

const lnSendPayment = async ({
  senderWalletId,
  username,
  decodedInvoice,
  amount,
  memo,
  logger,
}: {
  senderWalletId: WalletId
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

  const usdPerSat = await getCurrentPrice()
  if (usdPerSat instanceof Error) return usdPerSat

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const isLocal = lndService.isLocal(decodedInvoice.destination)
  if (isLocal instanceof Error) return isLocal

  if (isLocal) {
    const executedPayment = await executePaymentViaIntraledger({
      paymentHash: decodedInvoice.paymentHash,
      description: decodedInvoice.description,
      amount,
      usdPerSat,
      memo,
      senderWalletId,
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
    senderWalletId,
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
  senderWalletId,
  payerUsername,
  lndService,
  logger,
}: {
  paymentHash: PaymentHash
  description: string
  amount: Satoshis
  usdPerSat: UsdPerSat
  memo: string
  senderWalletId: WalletId
  payerUsername: Username
  lndService: ILightningService
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.IntraLedger,
  })
  const intraledgerLimitCheck = await checkIntraledgerLimits({
    amount,
    walletId: senderWalletId,
  })
  if (intraledgerLimitCheck instanceof Error) return intraledgerLimitCheck

  const invoicesRepo = WalletInvoicesRepository()
  const walletInvoice = await invoicesRepo.findByPaymentHash(paymentHash)
  if (walletInvoice instanceof Error) return walletInvoice

  const validatedResult =
    WalletInvoiceValidator(walletInvoice).validateToSend(senderWalletId)
  if (validatedResult instanceof AlreadyPaidError) return PaymentSendStatus.AlreadyPaid
  if (validatedResult instanceof Error) return validatedResult
  const { pubkey: recipientPubkey, walletId: recipientWalletId } = walletInvoice

  const senderWallet = await getWallet(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet
  const recipientWallet = await getWallet(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet

  const lnFee = toSats(0)
  const sats = toSats(amount + lnFee)
  const usd = sats * usdPerSat
  const usdFee = lnFee * usdPerSat

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
        LedgerService().addLnIntraledgerTxSend({
          senderWalletId,
          paymentHash,
          description,
          sats,
          fee: lnFee,
          usd,
          usdFee,
          recipientWalletId,
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

      const newWalletInvoice = await invoicesRepo.markAsPaid(walletInvoice.paymentHash)
      if (newWalletInvoice instanceof Error) return newWalletInvoice

      const notificationsService = NotificationsService(logger)
      notificationsService.lnInvoicePaid({
        paymentHash,
        recipientWalletId,
        amount,
        usdPerSat,
      })

      return PaymentSendStatus.Success
    },
  )
}

const executePaymentViaLn = async ({
  decodedInvoice,
  amount,
  usdPerSat,
  senderWalletId,
  lndService,
  logger,
}: {
  decodedInvoice: LnInvoice
  amount: Satoshis
  usdPerSat: UsdPerSat
  senderWalletId: WalletId
  lndService: ILightningService
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.Lightning,
  })
  const { paymentHash } = decodedInvoice

  const withdrawalLimitCheck = await checkWithdrawalLimits({
    amount,
    walletId: senderWalletId,
  })
  if (withdrawalLimitCheck instanceof Error) return withdrawalLimitCheck

  const key = CachedRouteLookupKeyFactory().create({
    paymentHash,
    milliSats: toMilliSatsFromNumber(amount * 1000),
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
    }
  }

  const maxFee = LnFeeCalculator().max(amount)
  const lnFee = route ? route.roundedUpFee : maxFee
  const sats = toSats(amount + lnFee)
  const usd = sats * usdPerSat
  const usdFee = lnFee * usdPerSat

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

      const ledgerService = LedgerService()
      const journal = await LockService().extendLock({ logger, lock }, async () =>
        ledgerService.addLnTxSend({
          walletId: senderWalletId,
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
          walletId: senderWalletId,
          journalId,
          paymentHash,
          maxFee,
          actualFee: payResult.roundedUpFee,
          logger,
        })
        if (reimbursed instanceof Error) return reimbursed
      }

      return PaymentSendStatus.Success
    },
  )
}
