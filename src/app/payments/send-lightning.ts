import { WalletCurrency } from "@domain/shared"
import {
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  CouldNotFindLightningPaymentFlowError,
  PriceRatio,
  InvalidLightningPaymentFlowBuilderStateError,
} from "@domain/payments"
import { AccountValidator } from "@domain/accounts"
import { checkedToWalletId, SettlementMethod } from "@domain/wallets"
import {
  decodeInvoice,
  LnAlreadyPaidError,
  LnPaymentPendingError,
  PaymentSendStatus,
} from "@domain/bitcoin/lightning"
import { AlreadyPaidError, InsufficientBalanceError } from "@domain/errors"

import { LndService } from "@services/lnd"
import {
  LnPaymentsRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@services/mongoose"
import { PaymentsRepository } from "@services/redis"

import { LockService } from "@services/lock"
import { LedgerService } from "@services/ledger"
import { NotificationsService } from "@services/notifications"

import {
  constructPaymentFlowBuilder,
  newCheckWithdrawalLimits,
  newCheckIntraledgerLimits,
} from "./helpers"

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

  const { paymentAmount: lnInvoiceAmount } = decodedInvoice
  if (!(lnInvoiceAmount && lnInvoiceAmount.amount > 0n)) {
    return new LnPaymentRequestNonZeroAmountRequiredError()
  }

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  const accountValidated = AccountValidator().validateAccount({
    account: senderAccount,
    accountIdFromWallet: senderWallet.accountId,
  })
  if (accountValidated instanceof Error) return accountValidated

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
    if (builder instanceof AlreadyPaidError) return PaymentSendStatus.AlreadyPaid
    if (builder instanceof Error) return builder
    paymentFlow = await builder.withoutRoute()
  }
  if (paymentFlow instanceof Error) return paymentFlow

  // Note: probe for USD fee not necessary since we can get the fee otherwise

  // Get display currency price... add to payment flow builder?

  return paymentFlow.settlementMethod === SettlementMethod.IntraLedger
    ? executePaymentViaIntraledger({ paymentFlow, senderWallet, logger })
    : executePaymentViaLn({ decodedInvoice, paymentFlow, senderWallet, logger })
}

const executePaymentViaIntraledger = async ({
  paymentFlow,
  senderWallet,
  logger,
}: {
  paymentFlow: PaymentFlow<WalletCurrency, WalletCurrency>
  senderWallet: Wallet
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const limitCheck = await newCheckIntraledgerLimits({
    amount: paymentFlow.usdPaymentAmount,
    wallet: senderWallet,
    priceRatio: PriceRatio({
      usd: paymentFlow.usdPaymentAmount,
      btc: paymentFlow.btcPaymentAmount,
    }),
  })
  if (limitCheck instanceof Error) return limitCheck

  const { paymentHash } = paymentFlow

  const { recipientWalletId, recipientPubkey, recipientWalletCurrency } =
    paymentFlow.recipientDetails()
  if (!(recipientWalletId && recipientWalletCurrency && recipientPubkey)) {
    return new InvalidLightningPaymentFlowBuilderStateError(
      "Expected recipient details missing",
    )
  }
  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet

  return LockService().lockWalletId(
    { walletId: senderWallet.id, logger },
    async (lock) => {
      const balance = await LedgerService().getWalletBalanceAmount({
        walletId: senderWallet.id,
        walletCurrency: senderWallet.currency,
      })
      if (balance instanceof Error) return balance

      const paymentAmount = paymentFlow.paymentAmountInSenderWalletCurrency()

      if (balance.amount < paymentAmount.amount) {
        const unitForMsg = senderWallet.currency === WalletCurrency.Btc ? "sats" : "cents"
        return new InsufficientBalanceError(
          `Payment amount '${paymentAmount.amount}' ${unitForMsg} exceeds balance '${balance.amount}'`,
        )
      }

      const ledgerService = LedgerService()

      const journal = await LockService().extendLock({ logger, lock }, async () => {
        if (paymentFlow instanceof Error) return paymentFlow

        // - TODO: record initial transaction
      })
      if (journal instanceof Error) return journal

      const lndService = LndService()
      if (lndService instanceof Error) return lndService

      const deletedLnInvoice = await lndService.cancelInvoice({
        pubkey: recipientPubkey,
        paymentHash,
      })
      if (deletedLnInvoice instanceof Error) return deletedLnInvoice

      const newWalletInvoice = await WalletInvoicesRepository().markAsPaid(paymentHash)
      if (newWalletInvoice instanceof Error) return newWalletInvoice

      const notificationsService = NotificationsService(logger)

      if (recipientWalletCurrency === WalletCurrency.Btc) {
        notificationsService.lnInvoiceBitcoinWalletPaid({
          paymentHash,
          recipientWalletId,
          sats: paymentFlow.btcPaymentAmount.amount,
          displayCurrencyPerSat,
        })
      } else {
        notificationsService.lnInvoiceUsdWalletPaid({
          paymentHash,
          recipientWalletId,
          cents: paymentFlow.usdPaymentAmount.amount,
          displayCurrencyPerSat,
        })
      }

      return PaymentSendStatus.Success
    },
  )
}

const executePaymentViaLn = async ({
  decodedInvoice,
  paymentFlow,
  senderWallet,
  logger,
}: {
  decodedInvoice: LnInvoice
  paymentFlow: PaymentFlow<WalletCurrency, WalletCurrency>
  senderWallet: Wallet
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const limitCheck = await newCheckWithdrawalLimits({
    amount: paymentFlow.usdPaymentAmount,
    wallet: senderWallet,
    priceRatio: PriceRatio({
      usd: paymentFlow.usdPaymentAmount,
      btc: paymentFlow.btcPaymentAmount,
    }),
  })
  if (limitCheck instanceof Error) return limitCheck

  const { paymentHash } = decodedInvoice

  // - get cached route if exists
  const { rawRoute, outgoingNodePubkey } = paymentFlow.routeDetails()

  // - validate route amount?

  // - amount + fee in display currency?

  return LockService().lockWalletId(
    { walletId: senderWallet.id, logger },
    async (lock) => {
      const balance = await LedgerService().getWalletBalanceAmount({
        walletId: senderWallet.id,
        walletCurrency: senderWallet.currency,
      })
      if (balance instanceof Error) return balance

      const paymentAmount = paymentFlow.paymentAmountInSenderWalletCurrency()

      if (balance.amount < paymentAmount.amount) {
        const unitForMsg = senderWallet.currency === WalletCurrency.Btc ? "sats" : "cents"
        return new InsufficientBalanceError(
          `Payment amount '${paymentAmount.amount}' ${unitForMsg} exceeds balance '${balance.amount}'`,
        )
      }

      const ledgerService = LedgerService()

      const journal = await LockService().extendLock({ logger, lock }, async () => {
        if (paymentFlow instanceof Error) return paymentFlow

        // - TODO: record initial transaction
      })
      if (journal instanceof Error) return journal
      const { journalId } = journal

      const lndService = LndService()
      if (lndService instanceof Error) return lndService

      const payResult = rawRoute
        ? await lndService.payInvoiceViaRoutes({
            paymentHash,
            rawRoute,
            pubkey: outgoingNodePubkey,
          })
        : await lndService.newPayInvoiceViaPaymentDetails({
            decodedInvoice,
            btcPaymentAmount: paymentFlow.btcPaymentAmount,
            maxFeeAmount: paymentFlow.protocolFeeInBtc(),
          })

      // Fire-and-forget update to 'lnPayments' collection
      if (!(payResult instanceof LnAlreadyPaidError)) {
        LnPaymentsRepository().persistNew({
          paymentHash: decodedInvoice.paymentHash,
          paymentRequest: decodedInvoice.paymentRequest,
          sentFromPubkey: outgoingNodePubkey || lndService.defaultPubkey(),
        })

        if (!(payResult instanceof Error))
          ledgerService.updateMetadataByHash({
            hash: paymentHash,
            revealedPreImage: payResult.revealedPreImage,
          })
      }
      if (payResult instanceof LnPaymentPendingError) return PaymentSendStatus.Pending

      return PaymentSendStatus.Success
    },
  )
}
