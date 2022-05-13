import { toSats } from "@domain/bitcoin"
import { defaultTimeToExpiryInSeconds, PaymentStatus } from "@domain/bitcoin/lightning"
import { InconsistentDataError } from "@domain/errors"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { LockService } from "@services/lock"
import { runInParallel } from "@utils"

import { Wallets } from "@app"
import { WalletsRepository } from "@services/mongoose"

import { PaymentFlowStateRepository } from "@services/payment-flow"
import {
  CouldNotFindTransactionError,
  inputAmountFromLedgerTransaction,
  LedgerTransactionType,
  UnknownLedgerError,
} from "@domain/ledger"

import { PaymentFlowFromLedgerTransaction } from "./translations"

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

export const updatePendingPaymentsByWalletId = async ({
  walletId,
  logger,
}: {
  walletId: WalletId
  logger: Logger
}): Promise<void | ApplicationError> => {
  const ledgerService = LedgerService()
  const count = await ledgerService.getPendingPaymentsCount(walletId)
  if (count instanceof Error) return count
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
}

const updatePendingPayment = async ({
  walletId,
  pendingPayment,
  logger,
}: {
  walletId: WalletId
  pendingPayment: LedgerTransaction<WalletCurrency>
  logger: Logger
}): Promise<true | ApplicationError> => {
  const paymentLogger = logger.child({
    topic: "payment",
    protocol: "lightning",
    transactionType: "payment",
    onUs: false,
    payment: pendingPayment,
  })

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const { paymentHash, pubkey } = pendingPayment
  // If we had PaymentLedgerType => no need for checking the fields
  if (!paymentHash)
    throw new InconsistentDataError("paymentHash missing from payment transaction")
  if (!pubkey) throw new InconsistentDataError("pubkey missing from payment transaction")

  const lnPaymentLookup = await lndService.lookupPayment({
    pubkey,
    paymentHash,
  })
  if (lnPaymentLookup instanceof Error) {
    const lightningLogger = logger.child({
      topic: "payment",
      protocol: "lightning",
      transactionType: "payment",
      onUs: false,
    })
    lightningLogger.error({ err: lnPaymentLookup }, "issue fetching payment")
    return lnPaymentLookup
  }

  let roundedUpFee: Satoshis
  const { status } = lnPaymentLookup
  if (status != PaymentStatus.Failed) {
    roundedUpFee = lnPaymentLookup.confirmedDetails?.roundedUpFee || toSats(0)
  }

  if (status === PaymentStatus.Settled || status === PaymentStatus.Failed) {
    const ledgerService = LedgerService()
    return LockService().lockPaymentHash({ paymentHash }, async () => {
      const recorded = await ledgerService.isLnTxRecorded(paymentHash)
      if (recorded instanceof Error) {
        paymentLogger.error({ error: recorded }, "we couldn't query pending transaction")
        return recorded
      }

      if (recorded) {
        paymentLogger.info("payment has already been processed")
        return true
      }

      let paymentFlow = await PaymentFlowStateRepository(
        defaultTimeToExpiryInSeconds,
      ).updatePendingLightningPaymentFlow({
        senderWalletId: walletId,
        paymentHash,
        inputAmount: BigInt(inputAmountFromLedgerTransaction(pendingPayment)),

        paymentSentAndPending: false,
      })
      if (paymentFlow instanceof Error) {
        paymentFlow = await reconstructPendingPaymentFlow(paymentHash)
        if (paymentFlow instanceof Error) return paymentFlow
      }

      const settled = await ledgerService.settlePendingLnPayment(paymentHash)
      if (settled instanceof Error) {
        paymentLogger.error({ error: settled }, "no transaction to update")
        return settled
      }

      const wallet = await WalletsRepository().findById(walletId)
      if (wallet instanceof Error) return wallet

      if (status === PaymentStatus.Settled) {
        paymentLogger.info(
          { success: true, id: paymentHash, payment: pendingPayment },
          "payment has been confirmed",
        )

        const revealedPreImage = lnPaymentLookup.confirmedDetails?.revealedPreImage
        if (revealedPreImage)
          LedgerService().updateMetadataByHash({
            hash: paymentHash,
            revealedPreImage,
          })
        if (pendingPayment.feeKnownInAdvance) return true

        const { displayAmount, displayFee } = pendingPayment
        if (displayAmount === undefined || displayFee === undefined)
          return new UnknownLedgerError("missing display-related values in transaction")

        return Wallets.reimburseFee({
          paymentFlow,
          journalId: pendingPayment.journalId,
          actualFee: roundedUpFee,
          revealedPreImage,
          amountDisplayCurrency: displayAmount,
          feeDisplayCurrency: displayFee,
          logger,
        })
      } else if (status === PaymentStatus.Failed) {
        paymentLogger.warn(
          { success: false, id: paymentHash, payment: pendingPayment },
          "payment has failed. reverting transaction",
        )

        const voided = await ledgerService.revertLightningPayment({
          journalId: pendingPayment.journalId,
          paymentHash,
        })
        if (voided instanceof Error) {
          const error = `error voiding payment entry`
          logger.fatal({ success: false, result: lnPaymentLookup }, error)
          return voided
        }
      }
      return true
    })
  }
  return true
}

const reconstructPendingPaymentFlow = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>(
  paymentHash: PaymentHash,
): Promise<PaymentFlow<S, R> | ApplicationError> => {
  const ledgerTxns = await LedgerService().getTransactionsByHash(paymentHash)
  if (ledgerTxns instanceof Error) return ledgerTxns

  const payment = ledgerTxns.find(
    (tx) =>
      tx.pendingConfirmation === true &&
      tx.type === LedgerTransactionType.Payment &&
      tx.debit > 0,
  ) as LedgerTransaction<S> | undefined
  if (!payment) return new CouldNotFindTransactionError()

  return PaymentFlowFromLedgerTransaction(payment)
}
