import { WalletCurrency } from "@domain/shared"
import {
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  CouldNotFindLightningPaymentFlowError,
} from "@domain/payments"
import { checkedToWalletId } from "@domain/wallets"
import {
  decodeInvoice,
  LnAlreadyPaidError,
  LnPaymentPendingError,
  PaymentSendStatus,
} from "@domain/bitcoin/lightning"

import { LndService } from "@services/lnd"
import { WalletsRepository } from "@services/mongoose"
import { PaymentsRepository } from "@services/redis"

import { LockService } from "@services/lock"
import { LedgerService } from "@services/ledger"
import { InsufficientBalanceError } from "@domain/errors"

import { constructPaymentFlowBuilder, newCheckWithdrawalLimits } from "./helpers"

export const payInvoiceByWalletId = async ({
  paymentRequest,
  memo,
  senderWalletId: uncheckedSenderWalletId,
  senderAccount,
  logger,
}: {
  senderWalletId: string
  paymentRequest: EncodedPaymentRequest
  memo: string
  senderAccount: Account
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return senderWalletId

  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice
  const { paymentHash } = decodedInvoice

  const { paymentAmount: lnInvoiceAmount } = decodedInvoice
  if (!(lnInvoiceAmount && lnInvoiceAmount.amount > 0n)) {
    return new LnPaymentRequestNonZeroAmountRequiredError()
  }

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  let paymentFlow = await PaymentsRepository().findLightningPaymentFlow({
    walletId: senderWalletId,
    paymentHash: decodedInvoice.paymentHash,
    inputAmount: lnInvoiceAmount.amount,
  })

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  if (paymentFlow instanceof CouldNotFindLightningPaymentFlowError) {
    const builder = await constructPaymentFlowBuilder({
      senderWallet,
      invoice: decodedInvoice,
    })
    if (builder instanceof Error) return builder
    paymentFlow = await builder.withoutRoute()
  }
  if (paymentFlow instanceof Error) return paymentFlow

  // Note: probe for USD fee not necessary since we can get the fee otherwise

  // Validation checks
  // - [x] checkedToAmount
  // - [ ] sender account active
  // - [x] checked to sender walletId
  // - [x] check sender wallet exists
  // - [ ] match sender wallet `accountId` to `account.id`
  // - [x] optional, checkedToRecipientWalletId
  // - [ ] optional, check recipient wallet exists
  // - [ ] optional, check not self payment

  // Get display currency price?

  // ===
  // LN
  // ===

  // - limits check
  const limitCheck = await newCheckWithdrawalLimits({
    amount: paymentFlow.paymentAmountInUsd(),
    wallet: senderWallet,
  })
  if (limitCheck instanceof Error) return limitCheck

  // - get cached route if exists
  const { rawRoute, outgoingNodePubkey } = paymentFlow.routeFromCachedRoute()

  // - validate route amount?

  // - amount + fee in display currency?

  // - ENTER LOCK
  return LockService().lockWalletId(
    { walletId: senderWallet.id, logger },
    async (lock) => {
      if (paymentFlow instanceof Error) return paymentFlow

      // - get balance
      const balance = await LedgerService().getWalletBalanceAmount({
        walletId: senderWallet.id,
        walletCurrency: senderWallet.currency,
      })
      if (balance instanceof Error) return balance

      const paymentAmountInSenderWalletCurrency =
        paymentFlow.paymentAmountInSenderWalletCurrency()

      if (balance.amount < paymentAmountInSenderWalletCurrency.amount) {
        const unitForMsg = senderWallet.currency === WalletCurrency.Btc ? "sats" : "cents"
        return new InsufficientBalanceError(
          `Payment amount '${paymentAmountInSenderWalletCurrency.amount}' ${unitForMsg} exceeds balance '${balance.amount}'`,
        )
      }

      const journal = await LockService().extendLock({ logger, lock }, async () => {
        if (paymentFlow instanceof Error) return paymentFlow

        // - TODO: record initial transaction

        const payResult = rawRoute
          ? await lndService.payInvoiceViaRoutes({
              paymentHash,
              rawRoute,
              pubkey: outgoingNodePubkey,
            })
          : await lndService.newPayInvoiceViaPaymentDetails({
              decodedInvoice,
              btcPaymentAmount: paymentFlow.paymentAmountInBtc(),
              maxFeeAmount: paymentFlow.protocolFeeInBtc(),
            })
      })

      return PaymentSendStatus.Success
    },
  )

  // ===
  // Intraledger
  // ===
}
