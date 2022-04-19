import { WalletCurrency } from "@domain/shared"
import {
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  CouldNotFindLightningPaymentFlowError,
  PriceRatio,
  InvalidLightningPaymentFlowBuilderStateError,
  checkedToBtcPaymentAmount,
  checkedToUsdPaymentAmount,
} from "@domain/payments"
import { AccountValidator } from "@domain/accounts"
import {
  checkedToWalletId,
  PaymentInitiationMethod,
  SettlementMethod,
} from "@domain/wallets"
import { toMilliSatsFromNumber } from "@domain/bitcoin"
import {
  decodeInvoice,
  LnAlreadyPaidError,
  LnPaymentPendingError,
  PaymentSendStatus,
} from "@domain/bitcoin/lightning"
import { TwoFA, TwoFANewCodeNeededError } from "@domain/twoFA"
import { AlreadyPaidError, InsufficientBalanceError } from "@domain/errors"

import { LndService } from "@services/lnd"
import {
  LnPaymentsRepository,
  UsersRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@services/mongoose"
import { PaymentFlowStateRepository } from "@services/payment-flow"

import { LockService } from "@services/lock"
import { LedgerService } from "@services/ledger"
import { NotificationsService } from "@services/notifications"
import { NewDealerPriceService } from "@services/dealer-price"

import * as LedgerFacade from "@services/ledger/facade"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { Wallets } from "@app"

import {
  constructPaymentFlowBuilder,
  newCheckWithdrawalLimits,
  newCheckIntraledgerLimits,
  newCheckTwoFALimits,
} from "./helpers"

const dealer = NewDealerPriceService()

export const payInvoiceByWalletIdWithTwoFA = async ({
  paymentRequest,
  memo,
  senderWalletId: uncheckedSenderWalletId,
  senderAccount,
  twoFAToken,
  logger,
}: PayInvoiceByWalletIdWithTwoFAArgs): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })

  const validatedPaymentInputs = await validateInvoicePaymentInputs({
    paymentRequest,
    uncheckedSenderWalletId,
    senderAccount,
  })
  if (validatedPaymentInputs instanceof AlreadyPaidError)
    return PaymentSendStatus.AlreadyPaid
  if (validatedPaymentInputs instanceof Error) return validatedPaymentInputs
  const { senderWallet, paymentFlow, decodedInvoice } = validatedPaymentInputs

  const user = await UsersRepository().findById(senderAccount.ownerId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const priceRatio = PriceRatio({
    usd: paymentFlow.usdPaymentAmount,
    btc: paymentFlow.btcPaymentAmount,
  })
  if (priceRatio instanceof Error) return priceRatio

  const twoFACheck = twoFA?.secret
    ? await newCheckAndVerifyTwoFA({
        amount: paymentFlow.usdPaymentAmount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        wallet: senderWallet,
        priceRatio,
      })
    : true
  if (twoFACheck instanceof Error) return twoFACheck

  // Get display currency price... add to payment flow builder?

  return paymentFlow.settlementMethod === SettlementMethod.IntraLedger
    ? executePaymentViaIntraledger({
        paymentFlow,
        senderWallet,
        senderUsername: senderAccount.username,
        memo,
        logger,
      })
    : executePaymentViaLn({ decodedInvoice, paymentFlow, senderWallet, logger })
}

export const payInvoiceByWalletId = async ({
  paymentRequest,
  memo,
  senderWalletId: uncheckedSenderWalletId,
  senderAccount,
  logger,
}: PayInvoiceByWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  const validatedPaymentInputs = await validateInvoicePaymentInputs({
    paymentRequest,
    uncheckedSenderWalletId,
    senderAccount,
  })
  if (validatedPaymentInputs instanceof AlreadyPaidError)
    return PaymentSendStatus.AlreadyPaid
  if (validatedPaymentInputs instanceof Error) return validatedPaymentInputs
  const { senderWallet, paymentFlow, decodedInvoice } = validatedPaymentInputs

  // Get display currency price... add to payment flow builder?

  return paymentFlow.settlementMethod === SettlementMethod.IntraLedger
    ? executePaymentViaIntraledger({
        paymentFlow,
        senderWallet,
        senderUsername: senderAccount.username,
        memo,
        logger,
      })
    : executePaymentViaLn({ decodedInvoice, paymentFlow, senderWallet, logger })
}

export const payNoAmountInvoiceByWalletIdWithTwoFA = async ({
  paymentRequest,
  amount,
  memo,
  senderWalletId: uncheckedSenderWalletId,
  senderAccount,
  twoFAToken,
  logger,
}: PayNoAmountInvoiceByWalletIdWithTwoFAArgs): Promise<
  PaymentSendStatus | ApplicationError
> => {
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })
  const validatedNoAmountPaymentInputs = await validateNoAmountInvoicePaymentInputs({
    paymentRequest,
    amount,
    uncheckedSenderWalletId,
    senderAccount,
  })
  if (validatedNoAmountPaymentInputs instanceof AlreadyPaidError)
    return PaymentSendStatus.AlreadyPaid
  if (validatedNoAmountPaymentInputs instanceof Error)
    return validatedNoAmountPaymentInputs
  const { senderWallet, paymentFlow, decodedInvoice } = validatedNoAmountPaymentInputs

  const user = await UsersRepository().findById(senderAccount.ownerId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const priceRatio = PriceRatio({
    usd: paymentFlow.usdPaymentAmount,
    btc: paymentFlow.btcPaymentAmount,
  })
  if (priceRatio instanceof Error) return priceRatio

  const twoFACheck = twoFA?.secret
    ? await newCheckAndVerifyTwoFA({
        amount: paymentFlow.usdPaymentAmount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        wallet: senderWallet,
        priceRatio,
      })
    : true
  if (twoFACheck instanceof Error) return twoFACheck

  // Get display currency price... add to payment flow builder?

  return paymentFlow.settlementMethod === SettlementMethod.IntraLedger
    ? executePaymentViaIntraledger({
        paymentFlow,
        senderWallet,
        senderUsername: senderAccount.username,
        memo,
        logger,
      })
    : executePaymentViaLn({ decodedInvoice, paymentFlow, senderWallet, logger })
}

export const payNoAmountInvoiceByWalletId = async ({
  paymentRequest,
  amount,
  memo,
  senderWalletId: uncheckedSenderWalletId,
  senderAccount,
  logger,
}: PayNoAmountInvoiceByWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  const validatedNoAmountPaymentInputs = await validateNoAmountInvoicePaymentInputs({
    paymentRequest,
    amount,
    uncheckedSenderWalletId,
    senderAccount,
  })
  if (validatedNoAmountPaymentInputs instanceof AlreadyPaidError)
    return PaymentSendStatus.AlreadyPaid
  if (validatedNoAmountPaymentInputs instanceof Error)
    return validatedNoAmountPaymentInputs
  const { senderWallet, paymentFlow, decodedInvoice } = validatedNoAmountPaymentInputs

  // Get display currency price... add to payment flow builder?

  return paymentFlow.settlementMethod === SettlementMethod.IntraLedger
    ? executePaymentViaIntraledger({
        paymentFlow,
        senderWallet,
        senderUsername: senderAccount.username,
        memo,
        logger,
      })
    : executePaymentViaLn({ decodedInvoice, paymentFlow, senderWallet, logger })
}

const validateInvoicePaymentInputs = async ({
  paymentRequest,
  uncheckedSenderWalletId,
  senderAccount,
}) => {
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

  let paymentFlow = await PaymentFlowStateRepository().findLightningPaymentFlow({
    walletId: senderWalletId,
    paymentHash: decodedInvoice.paymentHash,
    inputAmount: lnInvoiceAmount.amount,
  })

  if (paymentFlow instanceof CouldNotFindLightningPaymentFlowError) {
    const builderWithConversion = await constructPaymentFlowBuilder({
      senderWallet,
      invoice: decodedInvoice,
      usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
      btcFromUsd: dealer.getSatsFromCentsForImmediateSell,
    })
    if (builderWithConversion instanceof Error) return builderWithConversion

    paymentFlow = await builderWithConversion.withoutRoute()
  }
  if (paymentFlow instanceof Error) return paymentFlow

  const persistedPayment = await PaymentFlowStateRepository().persistNew(paymentFlow)
  if (persistedPayment instanceof Error) return persistedPayment

  return {
    senderWallet,
    paymentFlow,
    decodedInvoice,
  }
}

const validateNoAmountInvoicePaymentInputs = async ({
  paymentRequest,
  amount,
  uncheckedSenderWalletId,
  senderAccount,
}) => {
  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return senderWalletId

  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { paymentAmount: lnInvoiceAmount } = decodedInvoice
  if (lnInvoiceAmount && lnInvoiceAmount.amount > 0n) {
    return new LnPaymentRequestZeroAmountRequiredError()
  }

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  const accountValidated = AccountValidator().validateAccount({
    account: senderAccount,
    accountIdFromWallet: senderWallet.accountId,
  })
  if (accountValidated instanceof Error) return accountValidated

  const inputPaymentAmount =
    senderWallet.currency === WalletCurrency.Btc
      ? checkedToBtcPaymentAmount(amount)
      : checkedToUsdPaymentAmount(amount)
  if (inputPaymentAmount instanceof Error) return inputPaymentAmount

  let paymentFlow = await PaymentFlowStateRepository().findLightningPaymentFlow({
    walletId: senderWalletId,
    paymentHash: decodedInvoice.paymentHash,
    inputAmount: inputPaymentAmount.amount,
  })

  if (paymentFlow instanceof CouldNotFindLightningPaymentFlowError) {
    const builderWithConversion = await constructPaymentFlowBuilder({
      uncheckedAmount: amount,
      senderWallet,
      invoice: decodedInvoice,
      usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
      btcFromUsd: dealer.getSatsFromCentsForImmediateSell,
    })
    if (builderWithConversion instanceof Error) return builderWithConversion

    paymentFlow = await builderWithConversion.withoutRoute()
  }
  if (paymentFlow instanceof Error) return paymentFlow

  return {
    senderWallet,
    paymentFlow,
    decodedInvoice,
  }
}

const newCheckAndVerifyTwoFA = async ({
  amount,
  twoFAToken,
  twoFASecret,
  wallet,
  priceRatio,
}: {
  amount: UsdPaymentAmount
  twoFAToken: TwoFAToken | null
  twoFASecret: TwoFASecret
  wallet: Wallet
  priceRatio: PriceRatio
}): Promise<true | ApplicationError> => {
  const twoFALimitCheck = await newCheckTwoFALimits({
    amount,
    wallet,
    priceRatio,
  })
  if (!(twoFALimitCheck instanceof Error)) return true

  if (!twoFAToken) return new TwoFANewCodeNeededError()

  const validTwoFA = TwoFA().verify({
    secret: twoFASecret,
    token: twoFAToken,
  })
  if (validTwoFA instanceof Error) return validTwoFA

  return true
}

const executePaymentViaIntraledger = async ({
  paymentFlow,
  senderWallet,
  logger,
  senderUsername,
  memo,
}: {
  paymentFlow: PaymentFlow<WalletCurrency, WalletCurrency>
  senderWallet: Wallet
  logger: Logger
  senderUsername: Username | undefined
  memo: string | null
}): Promise<PaymentSendStatus | ApplicationError> => {
  const priceRatio = PriceRatio({
    usd: paymentFlow.usdPaymentAmount,
    btc: paymentFlow.btcPaymentAmount,
  })
  if (priceRatio instanceof Error) return priceRatio

  const limitCheck = await newCheckIntraledgerLimits({
    amount: paymentFlow.usdPaymentAmount,
    wallet: senderWallet,
    priceRatio,
  })
  if (limitCheck instanceof Error) return limitCheck

  const { paymentHash } = paymentFlow

  const {
    recipientWalletId,
    recipientPubkey,
    recipientWalletCurrency,
    recipientUsername,
  } = paymentFlow.recipientDetails()
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

      const journal = await LockService().extendLock({ logger, lock }, async () => {
        const lnIntraLedgerMetadata = LedgerFacade.LnIntraledgerLedgerMetadata({
          // FIXME: display currency
          amountDisplayCurrency: Number(
            paymentFlow.usdPaymentAmount.amount,
          ) as DisplayCurrencyBaseAmount,

          memoOfPayer: memo || undefined,
          senderUsername,
          recipientUsername,
          pubkey: recipientPubkey,
          paymentHash,
        })
        const { metadata, debitAccountAdditionalMetadata: additionalDebitMetadata } =
          lnIntraLedgerMetadata

        // FIXME: change to 'recipient'
        const receiverWalletDescriptor = paymentFlow.recipientWalletDescriptor()
        if (receiverWalletDescriptor === undefined)
          return new InvalidLightningPaymentFlowBuilderStateError()

        return LedgerFacade.recordIntraledger({
          description: paymentFlow.descriptionFromInvoice,
          amount: {
            btc: paymentFlow.btcPaymentAmount,
            usd: paymentFlow.usdPaymentAmount,
          },
          senderWalletDescriptor: paymentFlow.senderWalletDescriptor(),
          receiverWalletDescriptor,
          metadata,
          additionalDebitMetadata,
        })
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
          displayCurrencyPerSat: priceRatio.usdPerSat(),
        })
      } else {
        notificationsService.lnInvoiceUsdWalletPaid({
          paymentHash,
          recipientWalletId,
          cents: paymentFlow.usdPaymentAmount.amount,
          displayCurrencyPerSat: priceRatio.usdPerSat(),
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
  const priceRatio = PriceRatio({
    usd: paymentFlow.usdPaymentAmount,
    btc: paymentFlow.btcPaymentAmount,
  })
  if (priceRatio instanceof Error) return priceRatio

  const limitCheck = await newCheckWithdrawalLimits({
    amount: paymentFlow.usdPaymentAmount,
    wallet: senderWallet,
    priceRatio,
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

      const lndService = LndService()
      if (lndService instanceof Error) return lndService

      const journal = await LockService().extendLock({ logger, lock }, async () => {
        const metadata = LedgerFacade.LnSendLedgerMetadata({
          // FIXME: display currency
          amountDisplayCurrency: Number(
            paymentFlow.usdPaymentAmount.amount,
          ) as DisplayCurrencyBaseAmount,
          feeDisplayCurrency: Number(
            paymentFlow.usdProtocolFee.amount,
          ) as DisplayCurrencyBaseAmount,

          fee: paymentFlow.btcProtocolFee,
          pubkey: outgoingNodePubkey || lndService.defaultPubkey(),
          paymentHash,
          feeKnownInAdvance: !!rawRoute,
        })

        return LedgerFacade.recordSend({
          description: paymentFlow.descriptionFromInvoice,
          amountToDebitSender: {
            btc: {
              currency: paymentFlow.btcPaymentAmount.currency,
              amount:
                paymentFlow.btcPaymentAmount.amount + paymentFlow.btcProtocolFee.amount,
            },
            usd: {
              currency: paymentFlow.usdPaymentAmount.currency,
              amount:
                paymentFlow.usdPaymentAmount.amount + paymentFlow.usdProtocolFee.amount,
            },
          },
          senderWalletDescriptor: paymentFlow.senderWalletDescriptor(),
          metadata,
        })
      })
      if (journal instanceof Error) return journal
      const { journalId } = journal

      const payResult = rawRoute
        ? await lndService.payInvoiceViaRoutes({
            paymentHash,
            rawRoute,
            pubkey: outgoingNodePubkey,
          })
        : await lndService.payInvoiceViaPaymentDetails({
            decodedInvoice,
            milliSatsAmount: toMilliSatsFromNumber(
              Number(paymentFlow.btcPaymentAmount.amount) * 1000,
            ),
            maxFee: paymentFlow.btcProtocolFee.amount,
          })

      // Fire-and-forget update to 'lnPayments' collection
      if (!(payResult instanceof LnAlreadyPaidError)) {
        LnPaymentsRepository().persistNew({
          paymentHash: decodedInvoice.paymentHash,
          paymentRequest: decodedInvoice.paymentRequest,
          sentFromPubkey: outgoingNodePubkey || lndService.defaultPubkey(),
        })

        if (!(payResult instanceof Error))
          LedgerFacade.updateMetadataByHash({
            hash: paymentHash,
            revealedPreImage: payResult.revealedPreImage,
          })
      }
      if (payResult instanceof LnPaymentPendingError) return PaymentSendStatus.Pending

      const settled = await LedgerFacade.settlePendingLnSend(paymentHash)
      if (settled instanceof Error) return settled

      if (payResult instanceof Error) {
        const voided = await LedgerFacade.recordLnSendRevert({
          journalId,
          paymentHash,
        })
        if (voided instanceof Error) return voided

        if (payResult instanceof LnAlreadyPaidError) return PaymentSendStatus.AlreadyPaid

        return payResult
      }

      if (!rawRoute) {
        const reimbursed = await Wallets.reimburseFee({
          paymentFlow,
          journalId,
          actualFee: payResult.roundedUpFee,
          revealedPreImage: payResult.revealedPreImage,
          logger,
        })
        if (reimbursed instanceof Error) return reimbursed
      }

      return PaymentSendStatus.Success
    },
  )
}
