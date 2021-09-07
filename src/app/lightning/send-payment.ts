import { getBalanceForWallet } from "@app/wallets"
import { getTwoFALimits, getUserLimits, MS_PER_DAY } from "@config/app"
import { toMilliSats, toSats } from "@domain/bitcoin"
import {
  decodeInvoice,
  LnPaymentPendingError,
  PaymentSendStatus,
  LnInvoiceValidator,
  LnFeeCalculator,
  LnAlreadyPaidError,
} from "@domain/bitcoin/lightning"
import {
  CouldNotFindError,
  InsufficientBalanceError,
  ValidationError,
} from "@domain/errors"
import { LedgerTransactionType, toLiabilitiesAccountId } from "@domain/ledger"
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

export const lnInvoicePaymentSend = async ({
  walletId,
  userId,
  invoice,
  amount,
  memo,
  twoFAToken,
  logger,
}: {
  walletId: WalletId
  userId: UserId
  invoice: EncodedPaymentRequest
  amount?: Satoshis
  memo?: string
  twoFAToken?: TwoFAToken
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const decodedInvoice = await decodeInvoice(invoice)
  if (decodedInvoice instanceof Error) return decodedInvoice
  const validatorResult = LnInvoiceValidator(decodedInvoice).validateToSend(amount)
  if (validatorResult instanceof Error) return validatorResult
  const { amount: paymentAmount } = validatorResult
  const { paymentHash } = decodedInvoice

  const ledgerService = LedgerService()
  const lnService = LndService()
  if (lnService instanceof Error) return lnService

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
  const limitsChecker = LimitsChecker({
    walletVolume,
    userLimits,
    twoFALimits,
  })

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

  const isLocal = lnService.isLocal(decodedInvoice.destination)
  if (isLocal instanceof Error) return isLocal

  let route: CachedRoute | null = null
  let lndAuthForRoute: AuthenticatedLnd | null = null
  let recipientPubkey: Pubkey
  let recipientWalletId: WalletId
  let sendLnTxArgsLocal: {
    payerWalletName?: WalletName
    recipientWalletName?: WalletName
    memoPayer?: string
  } = {}
  const paymentPrepare = preparePayment({ paymentAmount, limitsChecker })
  if (isLocal) {
    const intraResult = await paymentPrepare.intraledger({
      paymentHash,
      walletId,
      userId,
      memo,
    })
    if (intraResult instanceof Error) return intraResult
    ;({ recipientPubkey, recipientWalletId, sendLnTxArgsLocal } = intraResult)
  } else {
    const extraResult = await paymentPrepare.extraledger({
      decodedInvoice,
      lnService,
    })
    if (extraResult instanceof Error) return extraResult
    ;({ route, lndAuthForRoute } = extraResult)
  }

  const price = await PriceService().getCurrentPrice()
  if (price instanceof Error) return price
  const maxFee = LnFeeCalculator().max(paymentAmount)
  const lnFee = isLocal ? toSats(0) : route ? toSats(route.safe_fee) : maxFee
  const sats = toSats(paymentAmount + lnFee)
  const internalFee = isLocal
    ? toSats(0)
    : ExtraLedgerFeeCalculator(paymentAmount).lnWithdrawalFee()
  const usd = sats * price
  const usdFee = internalFee * price

  return LockService().lockWalletId({ walletId, logger }, async (lock) => {
    const balance = await getBalanceForWallet({ walletId, logger })
    if (balance instanceof Error) return balance
    if (balance < sats) {
      return new InsufficientBalanceError(
        `Payment amount '${sats}' exceeds balance '${balance}'`,
      )
    }

    const journal = await LockService().extendLock({ logger, lock }, async () =>
      ledgerService.sendLnTx({
        liabilitiesAccountId,
        recipientLiabilitiesAccountId: recipientWalletId
          ? toLiabilitiesAccountId(recipientWalletId)
          : null,
        paymentHash,
        description: decodedInvoice.description,
        sats,
        fee: internalFee,
        usd,
        usdFee,
        feeKnownInAdvance: !!route,
        pending: !isLocal,
        type: isLocal ? LedgerTransactionType.IntraLedger : LedgerTransactionType.Payment,
        pubkey: route && lndAuthForRoute ? route.pubkey : lnService.defaultPubkey(),
        ...sendLnTxArgsLocal,
      }),
    )
    if (journal instanceof Error) return journal

    const paymentExecute = await executePayment({ paymentHash, lnService, logger })
    return isLocal
      ? paymentExecute.intraledger({
          pubkey: recipientPubkey,
        })
      : paymentExecute.extraledger({
          route,
          lndAuthForRoute,
          decodedInvoice,
          milliSatsAmount: toMilliSats(paymentAmount * 1000),
          maxFee,
          liabilitiesAccountId,
          journalId: journal.journalId,
        })
  })
}

const preparePayment = ({
  paymentAmount,
  limitsChecker,
}: {
  paymentAmount: Satoshis
  limitsChecker: LimitsChecker
}): PreparePayment => {
  const intraledger = async ({
    walletId,
    userId,
    paymentHash,
    memo,
  }: {
    walletId: WalletId
    userId: UserId
    paymentHash: PaymentHash
    memo?: string
  }): Promise<
    | {
        recipientPubkey: Pubkey
        recipientWalletId: WalletId
        sendLnTxArgsLocal: {
          payerWalletName?: WalletName
          recipientWalletName?: WalletName
          memoPayer?: string
        }
      }
    | ApplicationError
  > => {
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

    const sendLnTxArgsLocal = {
      payerWalletName: payerWallet.walletName || undefined,
      recipientWalletName: recipientWallet.walletName || undefined,
      memoPayer: memo,
    }

    const resultPayerAddRecipient = await addNewContact({
      userId,
      contactWalletId: recipientWalletId,
    })
    if (
      resultPayerAddRecipient instanceof Error &&
      !(resultPayerAddRecipient instanceof ValidationError)
    )
      return resultPayerAddRecipient

    return {
      recipientPubkey: recipientPubkey,
      recipientWalletId: recipientWallet.id,
      sendLnTxArgsLocal,
    }
  }

  const extraledger = async ({
    decodedInvoice,
    lnService,
  }: {
    decodedInvoice: LnInvoice
    lnService: ILightningService
  }): Promise<
    | { route: CachedRoute | null; lndAuthForRoute: AuthenticatedLnd | null }
    | ApplicationError
  > => {
    const withdrawalLimitCheck = limitsChecker.checkWithdrawal({
      pendingAmount: paymentAmount,
    })
    if (withdrawalLimitCheck instanceof Error) return withdrawalLimitCheck

    const routesRepo = RoutesRepository()
    const route = await routesRepo.findByPaymentHash({
      paymentHash: decodedInvoice.paymentHash,
      milliSatsAmounts: decodedInvoice.milliSatsAmount,
    })
    if (!route || route instanceof Error) return { route: null, lndAuthForRoute: null }

    const lndAuthForRoute = lnService.lndFromPubkey(route.pubkey)
    if (lndAuthForRoute instanceof Error) {
      const deleted = await routesRepo.deleteByPaymentHash({
        paymentHash: decodedInvoice.paymentHash,
        milliSatsAmounts: decodedInvoice.milliSatsAmount,
      })
      if (deleted instanceof Error) return deleted
      return { route, lndAuthForRoute: null }
    }

    return { route: route, lndAuthForRoute: lndAuthForRoute }
  }

  return {
    intraledger,
    extraledger,
  }
}

const executePayment = ({
  paymentHash,
  lnService,
  logger,
}: {
  paymentHash: PaymentHash
  lnService: ILightningService
  logger: Logger
}): ExecutePayment => {
  const intraledger = async ({
    pubkey,
  }: {
    pubkey: Pubkey
  }): Promise<PaymentSendStatus | ApplicationError> => {
    const deletedLnInvoice = await lnService.deleteUnpaidInvoice({
      pubkey,
      paymentHash,
    })
    if (deletedLnInvoice instanceof Error) return deletedLnInvoice

    return PaymentSendStatus.Success
  }

  const extraledger = async ({
    route,
    lndAuthForRoute,
    decodedInvoice,
    milliSatsAmount,
    maxFee,
    liabilitiesAccountId,
    journalId,
  }: {
    route: CachedRoute | null
    lndAuthForRoute: AuthenticatedLnd | null
    decodedInvoice: LnInvoice
    milliSatsAmount: MilliSatoshis
    maxFee: Satoshis
    liabilitiesAccountId: LiabilitiesAccountId
    journalId: LedgerJournalId
  }): Promise<PaymentSendStatus | ApplicationError> => {
    const payResult = await lnService.payInvoice({
      paymentHash,
      route: !(route instanceof Error) ? route : null,
      lndAuthForRoute,
      decodedInvoice,
      milliSatsAmount,
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
  }

  return {
    intraledger,
    extraledger,
  }
}
