import { getCurrentPrice } from "@app/prices"
import {
  checkAndVerifyTwoFA,
  checkIntraledgerLimits,
  checkWithdrawalLimits,
} from "@app/wallets/check-limit-helpers"
import { reimburseFee } from "@app/wallets/reimburse-fee"
import { checkedToSats, toMilliSatsFromNumber, toSats } from "@domain/bitcoin"
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
} from "@domain/errors"
import { DisplayCurrencyConversionRate } from "@domain/fiat/display-currency"
import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"
import { WalletInvoiceValidator } from "@domain/wallet-invoices"
import {
  PaymentInitiationMethod,
  PaymentInputValidator,
  SettlementMethod,
} from "@domain/wallets"
import { LockService } from "@services"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import {
  UsersRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@services/mongoose"
import { LnPaymentsRepository } from "@services/mongoose/ln-payments"
import { NotificationsService } from "@services/notifications"
import { RoutesCache } from "@services/redis/routes"
import { addAttributesToCurrentSpan } from "@services/tracing"

export const payInvoiceByWalletIdWithTwoFA = async ({
  paymentRequest,
  memo,
  senderWalletId,
  senderAccount,
  twoFAToken,
  logger,
}: PayInvoiceByWalletIdWithTwoFAArgs): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })

  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (!(lnInvoiceAmount && lnInvoiceAmount > 0)) {
    return new LnPaymentRequestNonZeroAmountRequiredError()
  }

  const user = await UsersRepository().findById(senderAccount.ownerId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const twoFACheck = twoFA?.secret
    ? await checkAndVerifyTwoFA({
        amount: lnInvoiceAmount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        walletId: senderWalletId,
        account: senderAccount,
      })
    : true
  if (twoFACheck instanceof Error) return twoFACheck

  return lnSendPayment({
    senderWalletId,
    senderAccount,
    decodedInvoice,
    amount: lnInvoiceAmount,
    memo: memo || "",
    logger,
  })
}

export const payInvoiceByWalletId = async ({
  paymentRequest,
  memo,
  senderWalletId,
  senderAccount,
  logger,
}: PayInvoiceByWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })

  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (!(lnInvoiceAmount && lnInvoiceAmount > 0)) {
    return new LnPaymentRequestNonZeroAmountRequiredError()
  }

  return lnSendPayment({
    senderWalletId,
    senderAccount,
    decodedInvoice,
    amount: lnInvoiceAmount,
    memo: memo || "",
    logger,
  })
}

export const payNoAmountInvoiceByWalletIdWithTwoFAArgs = async ({
  paymentRequest,
  amount: amountRaw,
  memo,
  senderWalletId,
  senderAccount,
  twoFAToken,
  logger,
}: PayNoAmountInvoiceByWalletIdWithTwoFAArgs): Promise<
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

  const user = await UsersRepository().findById(senderAccount.ownerId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const amount = checkedToSats(amountRaw)
  if (amount instanceof Error) return amount

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

  return lnSendPayment({
    senderWalletId,
    senderAccount,
    decodedInvoice,
    amount,
    memo: memo || "",
    logger,
  })
}

export const payNoAmountInvoiceByWalletId = async ({
  paymentRequest,
  amount,
  memo,
  senderWalletId,
  senderAccount,
  logger,
}: PayNoAmountInvoiceByWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })

  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (lnInvoiceAmount && lnInvoiceAmount > 0) {
    return new LnPaymentRequestZeroAmountRequiredError()
  }

  return lnSendPayment({
    senderWalletId,
    senderAccount,
    decodedInvoice,
    amount,
    memo: memo || "",
    logger,
  })
}

const lnSendPayment = async ({
  senderWalletId,
  senderAccount,
  decodedInvoice,
  amount: amountRaw,
  memo,
  logger,
}: {
  senderWalletId: WalletId
  senderAccount: Account
  decodedInvoice: LnInvoice
  amount: number
  memo: string
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.amount": amountRaw,
    "payment.request.destination": decodedInvoice.destination,
    "payment.request.hash": decodedInvoice.paymentHash,
    "payment.request.description": decodedInvoice.description,
  })

  const validator = PaymentInputValidator(WalletsRepository().findById)
  const validationResult = await validator.validateSender({
    amount: amountRaw,
    senderAccount,
    senderWalletId,
  })
  if (validationResult instanceof Error) return validationResult
  const { amount, senderWallet } = validationResult

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
      senderWallet,
      senderAccount,
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
    senderAccount,
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
  senderWallet,
  senderAccount,
  lndService,
  logger,
}: {
  paymentHash: PaymentHash
  description: string
  amount: Satoshis
  usdPerSat: UsdPerSat
  memo: string
  senderWallet: Wallet
  senderAccount: Account
  lndService: ILightningService
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.IntraLedger,
  })
  const intraledgerLimitCheck = await checkIntraledgerLimits({
    amount,
    walletId: senderWallet.id,
    account: senderAccount,
  })
  if (intraledgerLimitCheck instanceof Error) return intraledgerLimitCheck

  const invoicesRepo = WalletInvoicesRepository()
  const walletInvoice = await invoicesRepo.findByPaymentHash(paymentHash)
  if (walletInvoice instanceof Error) return walletInvoice

  const validatedResult = WalletInvoiceValidator(walletInvoice).validateToSend(
    senderWallet.id,
  )
  if (validatedResult instanceof AlreadyPaidError) return PaymentSendStatus.AlreadyPaid
  if (validatedResult instanceof Error) return validatedResult
  const { pubkey: recipientPubkey, walletId: recipientWalletId } = walletInvoice

  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet

  const amountDisplayCurrency = DisplayCurrencyConversionRate(usdPerSat)(amount)

  return LockService().lockWalletId(
    { walletId: senderWallet.id, logger },
    async (lock) => {
      const balance = await LedgerService().getWalletBalance(senderWallet.id)
      if (balance instanceof Error) return balance
      if (balance < amount) {
        return new InsufficientBalanceError(
          `Payment amount '${amount}' exceeds balance '${balance}'`,
        )
      }

      const journal = await LockService().extendLock({ logger, lock }, async () =>
        LedgerService().addLnIntraledgerTxSend({
          senderWalletId: senderWallet.id,
          senderWalletCurrency: senderWallet.currency,
          senderUsername: senderAccount.username,
          paymentHash,
          description,
          sats: amount,
          amountDisplayCurrency,
          recipientWalletId,
          recipientWalletCurrency: recipientWallet.currency,
          recipientUsername: null,
          pubkey: lndService.defaultPubkey(),
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
  senderAccount,
  lndService,
  logger,
}: {
  decodedInvoice: LnInvoice
  amount: Satoshis
  usdPerSat: UsdPerSat
  senderWalletId: WalletId
  senderAccount: Account
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
    account: senderAccount,
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
  const feeRouting = route ? route.roundedUpFee : maxFee
  const sats = toSats(amount + feeRouting)
  const amountDisplayCurrency = DisplayCurrencyConversionRate(usdPerSat)(sats)
  const feeRoutingDisplayCurrency = DisplayCurrencyConversionRate(usdPerSat)(feeRouting)

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

      const ledgerService = LedgerService()
      const journal = await LockService().extendLock({ logger, lock }, async () =>
        ledgerService.addLnTxSend({
          walletId: senderWalletId,
          paymentHash,
          description: decodedInvoice.description,
          sats,
          feeRouting,
          amountDisplayCurrency,
          feeRoutingDisplayCurrency,
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

      // Fire-and-forget update to 'lnPayments' collection
      LnPaymentsRepository().persistNew({
        paymentHash: decodedInvoice.paymentHash,
        paymentRequest: decodedInvoice.paymentRequest,
        sentFromPubkey: rawRoute ? pubkey : lndService.defaultPubkey(),
      })

      if (payResult instanceof LnPaymentPendingError) return PaymentSendStatus.Pending

      const settled = await ledgerService.settlePendingLnPayment(paymentHash)
      if (settled instanceof Error) return settled

      if (payResult instanceof Error) {
        const voided = await ledgerService.revertLightningPayment(journalId)
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
