import { getCurrentPrice } from "@app/prices"
import {
  checkAndVerifyTwoFA,
  checkIntraledgerLimits,
  checkWithdrawalLimits,
} from "@app/wallets/check-limit-helpers"
import { reimburseFee } from "@app/wallets/reimburse-fee"
import { RouteValidator } from "@app/lightning/route-validator"

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
  NotImplementedError,
  NotReachableError,
} from "@domain/errors"
import { toCents } from "@domain/fiat"
import { DisplayCurrencyConverter } from "@domain/fiat/display-currency"
import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"
import { WalletInvoiceValidator } from "@domain/wallet-invoices"
import {
  PaymentInitiationMethod,
  PaymentInputValidator,
  SettlementMethod,
  WalletCurrency,
} from "@domain/wallets"
import { LockService } from "@services"
import { DealerPriceService } from "@services/dealer-price"
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

import { getNoAmountLightningFee, getRoutingFee } from "./get-lightning-fee"

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

  // FIXME: inefficient. wallet also fetched in lnSendPayment
  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  const displayCurrencyPerSat = await getCurrentPrice()
  if (displayCurrencyPerSat instanceof Error) return displayCurrencyPerSat

  const dCConverter = DisplayCurrencyConverter(displayCurrencyPerSat)
  // End FIXME

  const twoFACheck = twoFA?.secret
    ? await checkAndVerifyTwoFA({
        amount: lnInvoiceAmount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        walletId: senderWalletId,
        walletCurrency: senderWallet.currency,
        dCConverter,
        account: senderAccount,
      })
    : true
  if (twoFACheck instanceof Error) return twoFACheck

  return lnSendPayment({
    senderWalletId,
    senderAccount,
    decodedInvoice,
    amount: lnInvoiceAmount,
    invoiceWithAmount: true,
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

  // FIXME: temp workaround. force probe for USD wallet to simplify flow.
  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  if (senderWallet.currency === WalletCurrency.Usd) {
    await getRoutingFee({ paymentRequest, walletId: senderWalletId })
  }
  // END FIXME

  return lnSendPayment({
    senderWalletId,
    senderAccount,
    decodedInvoice,
    amount: lnInvoiceAmount,
    invoiceWithAmount: true,
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

  // FIXME: inefficient. wallet also fetched in lnSendPayment
  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  const displayCurrencyPerSat = await getCurrentPrice()
  if (displayCurrencyPerSat instanceof Error) return displayCurrencyPerSat

  const dCConverter = DisplayCurrencyConverter(displayCurrencyPerSat)
  // End FIXME

  const twoFACheck = twoFA?.secret
    ? await checkAndVerifyTwoFA({
        amount,
        dCConverter,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        walletId: senderWalletId,
        walletCurrency: senderWallet.currency,
        account: senderAccount,
      })
    : true
  if (twoFACheck instanceof Error) return twoFACheck

  return lnSendPayment({
    senderWalletId,
    senderAccount,
    decodedInvoice,
    amount,
    invoiceWithAmount: false,
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

  // FIXME: temp workaround. force probe for USD wallet to simplify flow.
  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  if (senderWallet.currency === WalletCurrency.Usd) {
    await getNoAmountLightningFee({ walletId: senderWalletId, amount, paymentRequest })
  }
  // END FIXME

  return lnSendPayment({
    senderWalletId,
    senderAccount,
    decodedInvoice,
    amount,
    invoiceWithAmount: false,
    memo: memo || "",
    logger,
  })
}

const lnSendPayment = async ({
  senderWalletId,
  senderAccount,
  decodedInvoice,
  amount: amountRaw,
  invoiceWithAmount,
  memo,
  logger,
}: {
  senderWalletId: WalletId
  senderAccount: Account
  decodedInvoice: LnInvoice
  amount: number
  invoiceWithAmount: boolean
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
  const validationResult = await validator.validatePaymentInput({
    amount: amountRaw,
    senderAccount,
    senderWalletId,
  })
  if (validationResult instanceof Error) return validationResult
  const { amount, senderWallet } = validationResult

  const displayCurrencyPerSat = await getCurrentPrice()
  if (displayCurrencyPerSat instanceof Error) return displayCurrencyPerSat

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const isLocal = lndService.isLocal(decodedInvoice.destination)
  if (isLocal instanceof Error) return isLocal

  if (isLocal) {
    const executedPayment = await executePaymentViaIntraledger({
      paymentHash: decodedInvoice.paymentHash,
      description: decodedInvoice.description,
      amount,
      displayCurrencyPerSat,
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
    invoiceWithAmount,
    displayCurrencyPerSat,
    senderWallet,
    senderAccount,
    lndService,
    logger,
  })
}

const executePaymentViaIntraledger = async ({
  paymentHash,
  description,
  amount,
  displayCurrencyPerSat,
  memo,
  senderWallet,
  senderAccount,
  lndService,
  logger,
}: {
  paymentHash: PaymentHash
  description: string
  amount: CurrencyBaseAmount
  displayCurrencyPerSat: DisplayCurrencyPerSat
  memo: string
  senderWallet: Wallet
  senderAccount: Account
  lndService: ILightningService
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.IntraLedger,
  })

  const dCConverter = DisplayCurrencyConverter(displayCurrencyPerSat)

  const intraledgerLimitCheck = await checkIntraledgerLimits({
    amount,
    dCConverter,
    walletId: senderWallet.id,
    walletCurrency: senderWallet.currency,
    account: senderAccount,
  })
  if (intraledgerLimitCheck instanceof Error) return intraledgerLimitCheck

  // TODO: manage Usd use case
  if (senderWallet.currency !== WalletCurrency.Btc) {
    return new NotImplementedError("USD Intraledger")
  }
  const amountSats = toSats(amount)

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

  const amountDisplayCurrency = dCConverter.fromSats(amountSats)

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
        LedgerService().addLnIntraledgerTxTransfer({
          senderWalletId: senderWallet.id,
          senderWalletCurrency: senderWallet.currency,
          senderUsername: senderAccount.username,
          paymentHash,
          description,
          sats: amountSats,
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
        amount: amountSats,
        displayCurrencyPerSat,
      })

      return PaymentSendStatus.Success
    },
  )
}

const executePaymentViaLn = async ({
  decodedInvoice,
  amount,
  invoiceWithAmount,
  displayCurrencyPerSat,
  senderWallet,
  senderAccount,
  lndService,
  logger,
}: {
  decodedInvoice: LnInvoice
  amount: CurrencyBaseAmount
  invoiceWithAmount: boolean
  displayCurrencyPerSat: DisplayCurrencyPerSat
  senderWallet: Wallet
  senderAccount: Account
  lndService: ILightningService
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.Lightning,
  })
  let cents: UsdCents | undefined
  let sats: Satoshis
  let feeRouting: Satoshis
  let key: CachedRouteLookupKey

  const dCConverter = DisplayCurrencyConverter(displayCurrencyPerSat)
  const dealerPriceService = DealerPriceService()

  const withdrawalLimitCheck = await checkWithdrawalLimits({
    amount,
    dCConverter,
    walletId: senderWallet.id,
    walletCurrency: senderWallet.currency,
    account: senderAccount,
  })
  if (withdrawalLimitCheck instanceof Error) return withdrawalLimitCheck

  const { paymentHash } = decodedInvoice

  // the only case where amount can be Cents is for Usd Wallet
  // where no sats where included in the invoice
  if (senderWallet.currency === WalletCurrency.Usd && !invoiceWithAmount) {
    key = CachedRouteLookupKeyFactory().createFromCents({
      paymentHash,
      cents: toCents(amount),
    })
  } else {
    key = CachedRouteLookupKeyFactory().createFromMilliSats({
      paymentHash,
      milliSats: toMilliSatsFromNumber(amount * 1000),
    })
  }
  const routesCache = RoutesCache()
  const cachedRoute = await routesCache.findByKey(key)

  let pubkey: Pubkey
  let rawRoute: RawRoute | null = null
  if (!(cachedRoute instanceof Error)) {
    // route has been cached

    ;({ pubkey, route: rawRoute } = cachedRoute)
    feeRouting = toSats(rawRoute.safe_fee)

    if (senderWallet.currency === WalletCurrency.Usd) {
      if (invoiceWithAmount) {
        // the invoice comes with an amount, so we start from Sats
        const baseSats = toSats(amount)
        const validateRoute = RouteValidator(rawRoute).validate(baseSats)
        if (validateRoute instanceof Error) return validateRoute

        sats = toSats(baseSats + feeRouting)
        const cents_ = await dealerPriceService.getCentsFromSatsForImmediateSell(sats)
        if (cents_ instanceof Error) return cents_
        cents = cents_
      } else {
        // the dealer already gave a price during the probe
        // TODO: test properly. move this to domain
        const baseCentsWithoutFee = toCents(amount)
        const satsWithoutFee = toSats(rawRoute.tokens - rawRoute.safe_fee)
        const ratio = satsWithoutFee / baseCentsWithoutFee
        sats = toSats(rawRoute.tokens)
        cents = toCents(sats / ratio)
      }
    } else {
      sats = toSats(amount + feeRouting)
    }
  } else {
    // route is not cached

    pubkey = lndService.defaultPubkey()

    if (senderWallet.currency === WalletCurrency.Usd) {
      // we are forcing the probe. if probe fails, then exit (for now)
      return new NotImplementedError("Routeless USD payments")

      // const centsBase = toCents(amount)
      // const feeRoutingCents = LnFeeCalculator().max(centsBase)
      // cents = toCents(centsBase + feeRoutingCents)
      // const totalSats = await dealerPriceService.getSatsFromCentsForImmediateSell(cents)
      // if (totalSats instanceof DealerPriceServiceError) return totalSats
      // sats = totalSats

      // feeRouting = LnFeeCalculator().inverseMax(sats)

      // console.log({ centsBase, cents, sats })
    } else {
      const satsBase = toSats(amount)
      feeRouting = LnFeeCalculator().max(satsBase)
      sats = toSats(satsBase + feeRouting)
    }
  }

  const amountDisplayCurrency = dCConverter.fromSats(sats)
  const feeRoutingDisplayCurrency = dCConverter.fromSats(feeRouting)

  return LockService().lockWalletId(
    { walletId: senderWallet.id, logger },
    async (lock) => {
      const balance = await LedgerService().getWalletBalance(senderWallet.id)
      if (balance instanceof Error) return balance

      if (senderWallet.currency === WalletCurrency.Usd) {
        if (cents === undefined) return new NotReachableError("cents is set here")
        if (balance < cents)
          return new InsufficientBalanceError(
            `Payment amount '${cents}' cents exceeds balance '${balance}'`,
          )
      }

      if (senderWallet.currency === WalletCurrency.Btc && balance < sats) {
        return new InsufficientBalanceError(
          `Payment amount '${sats}' sats exceeds balance '${balance}'`,
        )
      }

      const ledgerService = LedgerService()
      const journal = await LockService().extendLock({ logger, lock }, async () =>
        ledgerService.addLnTxSend({
          walletId: senderWallet.id,
          walletCurrency: senderWallet.currency,
          paymentHash,
          description: decodedInvoice.description,
          sats,
          cents,
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
            maxFee: feeRouting,
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
          walletId: senderWallet.id,
          walletCurrency: senderWallet.currency,
          journalId,
          paymentHash,
          maxFee: feeRouting,
          actualFee: payResult.roundedUpFee,
          logger,
        })
        if (reimbursed instanceof Error) return reimbursed
      }

      return PaymentSendStatus.Success
    },
  )
}
