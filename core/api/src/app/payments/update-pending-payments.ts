import { reimburseFee } from "./reimburse-fee"

import { reimburseFailedUsdPayment } from "./reimburse-failed-usd"

import { PaymentFlowFromLedgerTransaction } from "./translations"

import { getTransactionForWalletByJournalId } from "@/app/wallets"

import { toSats } from "@/domain/bitcoin"
import { defaultTimeToExpiryInSeconds, PaymentStatus } from "@/domain/bitcoin/lightning"
import { InconsistentDataError } from "@/domain/errors"
import {
  CouldNotFindTransactionError,
  inputAmountFromLedgerTransaction,
  LedgerTransactionType,
  MissingExpectedDisplayAmountsForTransactionError,
  MultiplePendingPaymentsForHashError,
} from "@/domain/ledger"
import { MissingPropsInTransactionForPaymentFlowError } from "@/domain/payments"
import { setErrorCritical, WalletCurrency } from "@/domain/shared"

import { LedgerService, getNonEndUserWalletIds } from "@/services/ledger"
import * as LedgerFacade from "@/services/ledger/facade"
import { LndService } from "@/services/lnd"
import { LockService } from "@/services/lock"
import {
  AccountsRepository,
  PaymentFlowStateRepository,
  UsersRepository,
  WalletsRepository,
} from "@/services/mongoose"
import { NotificationsService } from "@/services/notifications"
import { addAttributesToCurrentSpan, wrapAsyncToRunInSpan } from "@/services/tracing"
import { runInParallel } from "@/utils"

export const updatePendingPayments = async (logger: Logger): Promise<void> => {
  const ledgerService = LedgerService()
  const walletIdsWithPendingPayments = ledgerService.listWalletIdsWithPendingPayments()

  if (walletIdsWithPendingPayments instanceof Error) {
    logger.error(
      { error: walletIdsWithPendingPayments },
      "finish updating pending payments with error",
    )
    return
  }

  await runInParallel({
    iterator: walletIdsWithPendingPayments,
    logger,
    processor: async (walletId: WalletId, index: number) => {
      logger.trace(
        "updating pending payments for walletId %s in worker %d",
        walletId,
        index,
      )
      await updatePendingPaymentsByWalletId({ walletId, logger })
    },
  })

  logger.info("finish updating pending payments")
}

export const updatePendingPaymentsByWalletId = wrapAsyncToRunInSpan({
  namespace: "app.payments",
  fnName: "updatePendingPaymentsByWalletId",
  fn: async ({
    walletId,
    logger,
  }: {
    walletId: WalletId
    logger: Logger
  }): Promise<void | ApplicationError> => {
    const ledgerService = LedgerService()
    const count = await ledgerService.getPendingPaymentsCount(walletId)
    if (count instanceof Error) return count

    addAttributesToCurrentSpan({ pendingPaymentsCount: count })
    if (count === 0) return

    const pendingPayments = await ledgerService.listPendingPayments(walletId)
    if (pendingPayments instanceof Error) return pendingPayments

    for (const pendingPayment of pendingPayments) {
      await updatePendingPayment({
        walletId,
        pendingPayment,
        logger,
      })
    }
  },
})

export const updatePendingPaymentByHash = wrapAsyncToRunInSpan({
  namespace: "app.payments",
  fnName: "updatePendingPaymentByHash",
  fn: async ({
    paymentHash,
    logger,
  }: {
    paymentHash: PaymentHash
    logger: Logger
  }): Promise<void | ApplicationError> => {
    const walletId = await LedgerService().getWalletIdByPaymentHash(paymentHash)
    if (walletId instanceof Error) return walletId

    return updatePendingPaymentsByWalletId({
      walletId,
      logger,
    })
  },
})

const updatePendingPayment = wrapAsyncToRunInSpan({
  namespace: "app.payments",
  fnName: "updatePendingPayment",
  fn: async ({
    walletId,
    pendingPayment,
    logger,
  }: {
    walletId: WalletId
    pendingPayment: LedgerTransaction<WalletCurrency>
    logger: Logger
  }): Promise<true | ApplicationError> => {
    const { paymentHash, pubkey, type: txType } = pendingPayment
    addAttributesToCurrentSpan({ walletId, paymentHash, txType })

    const paymentLogger = logger.child({
      topic: "payment",
      protocol: "lightning",
      transactionType: "payment",
      onUs: false,
      payment: pendingPayment,
    })

    const lndService = LndService()
    if (lndService instanceof Error) return lndService

    // If we had PaymentLedgerType => no need for checking the fields
    if (!paymentHash)
      return new InconsistentDataError("paymentHash missing from payment transaction")
    if (!pubkey)
      return new InconsistentDataError("pubkey missing from payment transaction")

    const lnPaymentLookup = await lndService.lookupPayment({
      pubkey,
      paymentHash,
    })
    if (lnPaymentLookup instanceof Error) {
      logger.error(
        {
          err: lnPaymentLookup,
          topic: "payment",
          protocol: "lightning",
          transactionType: "payment",
          onUs: false,
        },
        "issue fetching payment",
      )
      return lnPaymentLookup
    }

    let roundedUpFee: Satoshis
    let satsAmount: Satoshis
    const { status } = lnPaymentLookup
    if (status != PaymentStatus.Failed) {
      roundedUpFee = lnPaymentLookup.confirmedDetails?.roundedUpFee || toSats(0)
      satsAmount = toSats(lnPaymentLookup.roundedUpAmount - roundedUpFee)
    }

    if (status === PaymentStatus.Pending) return true

    return LockService().lockWalletId(walletId, async () => {
      const ledgerService = LedgerService()
      const recorded = await ledgerService.isLnTxRecorded(paymentHash)
      if (recorded instanceof Error) {
        paymentLogger.error({ error: recorded }, "we couldn't query pending transaction")
        return recorded
      }

      if (recorded) {
        paymentLogger.info("payment has already been processed")
        return true
      }

      const inputAmount = inputAmountFromLedgerTransaction(pendingPayment)
      if (inputAmount instanceof Error) return inputAmount

      const paymentFlowIndex: PaymentFlowStateIndex = {
        paymentHash,
        walletId,
        inputAmount,
      }

      let paymentFlow = await PaymentFlowStateRepository(
        defaultTimeToExpiryInSeconds,
      ).markLightningPaymentFlowNotPending(paymentFlowIndex)
      if (paymentFlow instanceof Error) {
        paymentFlow = await reconstructPendingPaymentFlow({
          paymentHash,
          inputAmount: Number(inputAmount),
        })
        if (paymentFlow instanceof Error) return paymentFlow
      }

      const settled = await LedgerFacade.settlePendingLnSend(paymentHash)
      if (settled instanceof Error) {
        paymentLogger.error({ error: settled }, "no transaction to update")
        return settled
      }

      if (
        status === PaymentStatus.Failed ||
        // pendingPayment is a different version to latest payment from lnd
        satsAmount !== toSats(paymentFlow.btcPaymentAmount.amount)
      ) {
        paymentLogger.warn(
          { success: false, id: paymentHash, payment: pendingPayment },
          "payment has failed. reverting transaction",
        )
        if (paymentFlow.senderWalletCurrency === WalletCurrency.Btc) {
          const voided = await ledgerService.revertLightningPayment({
            journalId: pendingPayment.journalId,
            paymentHash,
          })
          if (voided instanceof Error) {
            const error = `error voiding payment entry`
            logger.fatal({ success: false, result: lnPaymentLookup }, error)
            return setErrorCritical(voided)
          }
          return voided
        }

        const reimbursed = await reimburseFailedUsdPayment({
          walletId,
          pendingPayment,
          paymentFlow,
        })
        if (reimbursed instanceof Error) {
          const error = `error reimbursing usd payment entry`
          logger.fatal({ success: false, result: lnPaymentLookup }, error)
          return setErrorCritical(reimbursed)
        }
        return reimbursed
      }

      paymentLogger.info(
        { success: true, id: paymentHash, payment: pendingPayment },
        "payment has been confirmed",
      )

      const revealedPreImage = lnPaymentLookup.confirmedDetails?.revealedPreImage
      if (revealedPreImage) {
        await LedgerService().updateMetadataByHash({
          hash: paymentHash,
          revealedPreImage,
        })
      }

      const senderWallet = await WalletsRepository().findById(walletId)
      if (senderWallet instanceof Error) return senderWallet

      const senderAccount = await AccountsRepository().findById(senderWallet.accountId)
      if (senderAccount instanceof Error) return senderAccount

      const senderUser = await UsersRepository().findById(senderAccount.kratosUserId)
      if (senderUser instanceof Error) return senderUser

      const walletTransaction = await getTransactionForWalletByJournalId({
        walletId,
        journalId: pendingPayment.journalId,
      })
      if (walletTransaction instanceof Error) return walletTransaction

      NotificationsService().sendTransaction({
        recipient: {
          accountId: senderWallet.accountId,
          walletId,
          userId: senderUser.id,
          level: senderAccount.level,
        },
        transaction: walletTransaction,
      })

      if (pendingPayment.feeKnownInAdvance) return true

      const { displayAmount, displayFee, displayCurrency } = pendingPayment
      if (!displayAmount || !displayFee || !displayCurrency) {
        return new MissingExpectedDisplayAmountsForTransactionError()
      }
      return reimburseFee({
        paymentFlow,
        senderDisplayAmount: displayAmount,
        senderDisplayCurrency: displayCurrency,
        journalId: pendingPayment.journalId,
        actualFee: roundedUpFee,
        revealedPreImage,
      })
    })
  },
})

const reconstructPendingPaymentFlow = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  paymentHash,
  inputAmount,
}: {
  paymentHash: PaymentHash
  inputAmount: number
}): Promise<PaymentFlow<S, R> | ApplicationError> => {
  const ledgerTxns = await LedgerService().getTransactionsByHash(paymentHash)
  if (ledgerTxns instanceof Error) return ledgerTxns

  const nonEndUserWalletIds = Object.values(await getNonEndUserWalletIds())

  const payments = ledgerTxns.filter(
    (tx) =>
      tx.pendingConfirmation === true &&
      tx.type === LedgerTransactionType.Payment &&
      tx.debit > 0 &&
      tx.walletId !== undefined &&
      !nonEndUserWalletIds.includes(tx.walletId),
  ) as LedgerTransaction<S>[] | undefined
  if (!(payments && payments.length)) return new CouldNotFindTransactionError()

  const { walletId: senderWalletId } = payments[0]
  if (!senderWalletId) return new MissingPropsInTransactionForPaymentFlowError()
  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet
  const senderAccount = await AccountsRepository().findById(senderWallet.accountId)
  if (senderAccount instanceof Error) return senderAccount

  const filteredPayments = payments.filter((tx) =>
    senderWallet.currency === WalletCurrency.Btc
      ? tx.satsAmount === inputAmount
      : tx.centsAmount === inputAmount,
  )
  if (!(filteredPayments && filteredPayments.length)) {
    return new CouldNotFindTransactionError()
  }
  // Note: Assumptions that rely on there being 1 pending payment
  //       - no more than one transaction gets settled for a given single lnd payment
  //       - fees are for the latest lnd payment attempt
  if (filteredPayments.length !== 1) {
    return new MultiplePendingPaymentsForHashError()
  }

  const payment = filteredPayments[0]

  return PaymentFlowFromLedgerTransaction({
    ledgerTxn: payment,
    senderAccountId: senderAccount.id,
  })
}
