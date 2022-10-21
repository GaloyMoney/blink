import { WalletCurrency } from "@domain/shared"
import {
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  PriceRatio,
  InvalidLightningPaymentFlowBuilderStateError,
  checkedToBtcPaymentAmount,
  checkedToUsdPaymentAmount,
  LnPaymentRequestInTransitError,
} from "@domain/payments"
import { AccountValidator } from "@domain/accounts"
import {
  checkedToWalletId,
  PaymentInitiationMethod,
  SettlementMethod,
} from "@domain/wallets"
import {
  decodeInvoice,
  defaultTimeToExpiryInSeconds,
  LnAlreadyPaidError,
  LnPaymentPendingError,
  PaymentSendStatus,
} from "@domain/bitcoin/lightning"
import { DisplayCurrency, NewDisplayCurrencyConverter } from "@domain/fiat"
import { AlreadyPaidError, CouldNotFindLightningPaymentFlowError } from "@domain/errors"

import { LndService } from "@services/lnd"
import {
  AccountsRepository,
  LnPaymentsRepository,
  UsersRepository,
  WalletInvoicesRepository,
  WalletsRepository,
  PaymentFlowStateRepository,
} from "@services/mongoose"

import { LockService } from "@services/lock"
import { LedgerService } from "@services/ledger"
import { NotificationsService } from "@services/notifications"
import { NewDealerPriceService } from "@services/dealer-price"

import * as LedgerFacade from "@services/ledger/facade"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { Wallets } from "@app"

import { ResourceExpiredLockServiceError } from "@domain/lock"

import {
  constructPaymentFlowBuilder,
  newCheckWithdrawalLimits,
  newCheckIntraledgerLimits,
  getPriceRatioForLimits,
  newCheckTradeIntraAccountLimits,
} from "./helpers"

const dealer = NewDealerPriceService()
const paymentFlowRepo = PaymentFlowStateRepository(defaultTimeToExpiryInSeconds)

export const payInvoiceByWalletId = async ({
  uncheckedPaymentRequest,
  memo,
  senderWalletId: uncheckedSenderWalletId,
  senderAccount,
}: PayInvoiceByWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })

  const validatedPaymentInputs = await validateInvoicePaymentInputs({
    uncheckedPaymentRequest,
    uncheckedSenderWalletId,
    senderAccount,
  })
  if (validatedPaymentInputs instanceof AlreadyPaidError) {
    return PaymentSendStatus.AlreadyPaid
  }
  if (validatedPaymentInputs instanceof Error) {
    return validatedPaymentInputs
  }
  const paymentFlow = await getPaymentFlow(validatedPaymentInputs)
  if (paymentFlow instanceof Error) return paymentFlow

  // Get display currency price... add to payment flow builder?

  const { senderWallet, decodedInvoice } = validatedPaymentInputs
  return paymentFlow.settlementMethod === SettlementMethod.IntraLedger
    ? executePaymentViaIntraledger({
        paymentFlow,
        senderWallet,
        senderUsername: senderAccount.username,
        memo,
      })
    : executePaymentViaLn({ decodedInvoice, paymentFlow, senderWallet })
}

export const payNoAmountInvoiceByWalletId = async ({
  uncheckedPaymentRequest,
  amount,
  memo,
  senderWalletId: uncheckedSenderWalletId,
  senderAccount,
}: PayNoAmountInvoiceByWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })

  const validatedNoAmountPaymentInputs = await validateNoAmountInvoicePaymentInputs({
    uncheckedPaymentRequest,
    amount,
    uncheckedSenderWalletId,
    senderAccount,
  })
  if (validatedNoAmountPaymentInputs instanceof AlreadyPaidError) {
    return PaymentSendStatus.AlreadyPaid
  }
  if (validatedNoAmountPaymentInputs instanceof Error) {
    return validatedNoAmountPaymentInputs
  }
  const paymentFlow = await getPaymentFlow(validatedNoAmountPaymentInputs)
  if (paymentFlow instanceof Error) return paymentFlow

  // Get display currency price... add to payment flow builder?

  const { senderWallet, decodedInvoice } = validatedNoAmountPaymentInputs
  return paymentFlow.settlementMethod === SettlementMethod.IntraLedger
    ? executePaymentViaIntraledger({
        paymentFlow,
        senderWallet,
        senderUsername: senderAccount.username,
        memo,
      })
    : executePaymentViaLn({ decodedInvoice, paymentFlow, senderWallet })
}

const validateInvoicePaymentInputs = async ({
  uncheckedPaymentRequest,
  uncheckedSenderWalletId,
  senderAccount,
}: {
  uncheckedPaymentRequest: string
  uncheckedSenderWalletId: string
  senderAccount: Account
}): Promise<
  | {
      senderWallet: Wallet
      decodedInvoice: LnInvoice
      inputPaymentAmount: BtcPaymentAmount
    }
  | ApplicationError
> => {
  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return senderWalletId

  const decodedInvoice = decodeInvoice(uncheckedPaymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice
  addAttributesToCurrentSpan({
    "payment.request.destination": decodedInvoice.destination,
    "payment.request.hash": decodedInvoice.paymentHash,
    "payment.request.description": decodedInvoice.description,
    "payment.request.expiresAt": decodedInvoice.expiresAt
      ? decodedInvoice.expiresAt.toISOString()
      : "undefined",
  })

  const { paymentAmount: lnInvoiceAmount } = decodedInvoice
  if (!(lnInvoiceAmount && lnInvoiceAmount.amount > 0n)) {
    return new LnPaymentRequestNonZeroAmountRequiredError()
  }

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  const accountValidator = AccountValidator(senderAccount)
  if (accountValidator instanceof Error) return accountValidator
  const validateWallet = accountValidator.validateWalletForAccount(senderWallet)
  if (validateWallet instanceof Error) return validateWallet

  return {
    senderWallet,
    decodedInvoice,
    inputPaymentAmount: lnInvoiceAmount,
  }
}

const validateNoAmountInvoicePaymentInputs = async <S extends WalletCurrency>({
  uncheckedPaymentRequest,
  amount,
  uncheckedSenderWalletId,
  senderAccount,
}: {
  uncheckedPaymentRequest: string
  amount: number
  uncheckedSenderWalletId: string
  senderAccount: Account
}): Promise<
  | {
      senderWallet: Wallet
      decodedInvoice: LnInvoice
      inputPaymentAmount: PaymentAmount<S>
      uncheckedAmount: number
    }
  | ApplicationError
> => {
  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return senderWalletId

  const decodedInvoice = decodeInvoice(uncheckedPaymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice
  addAttributesToCurrentSpan({
    "payment.request.destination": decodedInvoice.destination,
    "payment.request.hash": decodedInvoice.paymentHash,
    "payment.request.description": decodedInvoice.description,
    "payment.request.expiresAt": decodedInvoice.expiresAt
      ? decodedInvoice.expiresAt.toISOString()
      : "undefined",
  })

  const { paymentAmount: lnInvoiceAmount } = decodedInvoice
  if (lnInvoiceAmount && lnInvoiceAmount.amount > 0n) {
    return new LnPaymentRequestZeroAmountRequiredError()
  }

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  const accountValidator = AccountValidator(senderAccount)
  if (accountValidator instanceof Error) return accountValidator
  const validateWallet = accountValidator.validateWalletForAccount(senderWallet)
  if (validateWallet instanceof Error) return validateWallet

  const inputPaymentAmount =
    senderWallet.currency === WalletCurrency.Btc
      ? checkedToBtcPaymentAmount(amount)
      : checkedToUsdPaymentAmount(amount)
  if (inputPaymentAmount instanceof Error) return inputPaymentAmount

  return {
    senderWallet,
    decodedInvoice,
    inputPaymentAmount: inputPaymentAmount as PaymentAmount<S>,
    uncheckedAmount: amount,
  }
}

const getPaymentFlow = async <S extends WalletCurrency, R extends WalletCurrency>({
  senderWallet,
  decodedInvoice,
  inputPaymentAmount,
  uncheckedAmount,
}: {
  senderWallet: WalletDescriptor<S>
  decodedInvoice: LnInvoice
  inputPaymentAmount: PaymentAmount<S>
  uncheckedAmount?: number | undefined
}): Promise<PaymentFlow<S, R> | ApplicationError> => {
  let paymentFlow = await paymentFlowRepo.findLightningPaymentFlow<S, R>({
    walletId: senderWallet.id,
    paymentHash: decodedInvoice.paymentHash,
    inputAmount: inputPaymentAmount.amount,
  })
  addAttributesToCurrentSpan({
    "payment.paymentFlow.existsFromProbe": `${!(
      paymentFlow instanceof CouldNotFindLightningPaymentFlowError
    )}`,
  })

  if (paymentFlow instanceof CouldNotFindLightningPaymentFlowError) {
    const builderWithConversion = await constructPaymentFlowBuilder<S, R>({
      uncheckedAmount,
      senderWallet,
      invoice: decodedInvoice,
      hedgeBuyUsd: {
        usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
        btcFromUsd: dealer.getSatsFromCentsForImmediateBuy,
      },
      hedgeSellUsd: {
        usdFromBtc: dealer.getCentsFromSatsForImmediateSell,
        btcFromUsd: dealer.getSatsFromCentsForImmediateSell,
      },
    })
    if (builderWithConversion instanceof Error) return builderWithConversion

    paymentFlow = await builderWithConversion.withoutRoute()
    if (paymentFlow instanceof Error) return paymentFlow

    const persistedPayment = await paymentFlowRepo.persistNew(paymentFlow)
    if (persistedPayment instanceof Error) return persistedPayment
  }
  if (paymentFlow instanceof Error) return paymentFlow

  addAttributesToCurrentSpan({
    "payment.amount": paymentFlow.btcPaymentAmount.amount.toString(),
  })

  return paymentFlow
}

const executePaymentViaIntraledger = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  paymentFlow,
  senderWallet,
  senderUsername,
  memo,
}: {
  paymentFlow: PaymentFlow<S, R>
  senderWallet: WalletDescriptor<S>
  senderUsername: Username | undefined
  memo: string | null
}): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.IntraLedger,
  })

  const priceRatioForLimits = await getPriceRatioForLimits(paymentFlow)
  if (priceRatioForLimits instanceof Error) return priceRatioForLimits

  const paymentHash = paymentFlow.paymentHashForFlow()
  if (paymentHash instanceof Error) return paymentHash

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

  const checkLimits =
    senderWallet.accountId === recipientWallet.accountId
      ? newCheckTradeIntraAccountLimits
      : newCheckIntraledgerLimits
  const limitCheck = await checkLimits({
    amount: paymentFlow.usdPaymentAmount,
    wallet: senderWallet,
    priceRatio: priceRatioForLimits,
  })
  if (limitCheck instanceof Error) return limitCheck

  return LockService().lockWalletId(senderWallet.id, async (signal) => {
    const ledgerService = LedgerService()

    const recorded = await ledgerService.isLnTxRecorded(paymentHash)
    if (recorded instanceof Error) return recorded
    if (recorded) return PaymentSendStatus.AlreadyPaid

    const balance = await ledgerService.getWalletBalanceAmount(senderWallet)
    if (balance instanceof Error) return balance

    const balanceCheck = paymentFlow.checkBalanceForSend(balance)
    if (balanceCheck instanceof Error) return balanceCheck

    const priceRatio = PriceRatio({
      usd: paymentFlow.usdPaymentAmount,
      btc: paymentFlow.btcPaymentAmount,
    })
    if (priceRatio instanceof Error) return priceRatio
    const displayCentsPerSat = priceRatio.usdPerSat()

    const converter = NewDisplayCurrencyConverter(displayCentsPerSat)

    if (signal.aborted) {
      return new ResourceExpiredLockServiceError(signal.error?.message)
    }

    let metadata:
      | NewAddLnIntraledgerSendLedgerMetadata
      | NewAddLnTradeIntraAccountLedgerMetadata
    let additionalDebitMetadata: { [key: string]: string | undefined } = {}
    if (senderWallet.accountId === recipientWallet.accountId) {
      ;({ metadata, debitAccountAdditionalMetadata: additionalDebitMetadata } =
        LedgerFacade.LnTradeIntraAccountLedgerMetadata({
          paymentHash,
          pubkey: recipientPubkey,
          paymentFlow,

          amountDisplayCurrency: converter.fromUsdAmount(paymentFlow.usdPaymentAmount),
          feeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
          displayCurrency: DisplayCurrency.Usd,

          memoOfPayer: memo || undefined,
        }))
    } else {
      ;({ metadata, debitAccountAdditionalMetadata: additionalDebitMetadata } =
        LedgerFacade.LnIntraledgerLedgerMetadata({
          paymentHash,
          pubkey: recipientPubkey,
          paymentFlow,

          amountDisplayCurrency: converter.fromUsdAmount(paymentFlow.usdPaymentAmount),
          feeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
          displayCurrency: DisplayCurrency.Usd,

          memoOfPayer: memo || undefined,
          senderUsername,
          recipientUsername,
        }))
    }

    const recipientWalletDescriptor = paymentFlow.recipientWalletDescriptor()
    if (recipientWalletDescriptor === undefined)
      return new InvalidLightningPaymentFlowBuilderStateError()

    const journal = await LedgerFacade.recordIntraledger({
      description: paymentFlow.descriptionFromInvoice,
      amount: {
        btc: paymentFlow.btcPaymentAmount,
        usd: paymentFlow.usdPaymentAmount,
      },
      senderWalletDescriptor: paymentFlow.senderWalletDescriptor(),
      recipientWalletDescriptor,
      metadata,
      additionalDebitMetadata,
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

    const recipientAccount = await AccountsRepository().findById(
      recipientWallet.accountId,
    )
    if (recipientAccount instanceof Error) return recipientAccount

    const recipientUser = await UsersRepository().findById(recipientAccount.ownerId)
    if (recipientUser instanceof Error) return recipientUser

    let amount = paymentFlow.btcPaymentAmount.amount
    if (recipientWalletCurrency === WalletCurrency.Usd) {
      amount = paymentFlow.usdPaymentAmount.amount
    }

    const notificationsService = NotificationsService()
    notificationsService.lightningTxReceived({
      recipientAccountId: recipientWallet.accountId,
      recipientWalletId,
      paymentAmount: { amount, currency: recipientWalletCurrency },
      displayPaymentAmount: { amount: metadata.usd, currency: DisplayCurrency.Usd },
      paymentHash,
      recipientDeviceTokens: recipientUser.deviceTokens,
      recipientLanguage: recipientUser.language,
    })

    return PaymentSendStatus.Success
  })
}

const executePaymentViaLn = async ({
  decodedInvoice,
  paymentFlow,
  senderWallet,
}: {
  decodedInvoice: LnInvoice
  paymentFlow: PaymentFlow<WalletCurrency, WalletCurrency>
  senderWallet: Wallet
}): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.Lightning,
  })

  const priceRatioForLimits = await getPriceRatioForLimits(paymentFlow)
  if (priceRatioForLimits instanceof Error) return priceRatioForLimits

  const limitCheck = await newCheckWithdrawalLimits({
    amount: paymentFlow.usdPaymentAmount,
    wallet: senderWallet,
    priceRatio: priceRatioForLimits,
  })
  if (limitCheck instanceof Error) return limitCheck

  const { paymentHash } = decodedInvoice

  const { rawRoute, outgoingNodePubkey } = paymentFlow.routeDetails()

  return LockService().lockWalletId(senderWallet.id, async (signal) => {
    const ledgerService = LedgerService()

    const ledgerTransactions = await ledgerService.getTransactionsByHash(paymentHash)
    if (ledgerTransactions instanceof Error) return ledgerTransactions

    const pendingPayment = ledgerTransactions.find((tx) => tx.pendingConfirmation)
    if (pendingPayment) return new LnPaymentRequestInTransitError()

    const balance = await ledgerService.getWalletBalanceAmount(senderWallet)
    if (balance instanceof Error) return balance
    const balanceCheck = paymentFlow.checkBalanceForSend(balance)
    if (balanceCheck instanceof Error) return balanceCheck

    const lndService = LndService()
    if (lndService instanceof Error) return lndService

    const priceRatio = PriceRatio({
      usd: paymentFlow.usdPaymentAmount,
      btc: paymentFlow.btcPaymentAmount,
    })
    if (priceRatio instanceof Error) return priceRatio
    const displayCentsPerSat = priceRatio.usdPerSat()

    const converter = NewDisplayCurrencyConverter(displayCentsPerSat)

    if (signal.aborted) {
      return new ResourceExpiredLockServiceError(signal.error?.message)
    }

    const metadata = LedgerFacade.LnSendLedgerMetadata({
      amountDisplayCurrency: converter.fromUsdAmount(paymentFlow.usdPaymentAmount),
      feeDisplayCurrency: converter.fromUsdAmount(paymentFlow.usdProtocolFee),
      displayCurrency: DisplayCurrency.Usd,

      paymentFlow,
      pubkey: outgoingNodePubkey || lndService.defaultPubkey(),
      paymentHash,
      feeKnownInAdvance: !!rawRoute,
    })

    const journal = await LedgerFacade.recordSend({
      description: paymentFlow.descriptionFromInvoice,
      amountToDebitSender: {
        btc: {
          currency: paymentFlow.btcPaymentAmount.currency,
          amount: paymentFlow.btcPaymentAmount.amount + paymentFlow.btcProtocolFee.amount,
        },
        usd: {
          currency: paymentFlow.usdPaymentAmount.currency,
          amount: paymentFlow.usdPaymentAmount.amount + paymentFlow.usdProtocolFee.amount,
        },
      },
      senderWalletDescriptor: paymentFlow.senderWalletDescriptor(),
      metadata,
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
          btcPaymentAmount: paymentFlow.btcPaymentAmount,
          maxFeeAmount: paymentFlow.btcProtocolFee,
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
    if (payResult instanceof LnPaymentPendingError) {
      paymentFlow.paymentSentAndPending = true
      paymentFlowRepo.updateLightningPaymentFlow(paymentFlow)
      return PaymentSendStatus.Pending
    }

    const settled = await LedgerFacade.settlePendingLnSend(paymentHash)
    if (settled instanceof Error) return settled

    if (payResult instanceof Error) {
      const voided = await LedgerFacade.recordLnSendRevert({
        journalId,
        paymentHash,
      })
      if (voided instanceof Error) return voided

      if (payResult instanceof LnAlreadyPaidError) {
        return PaymentSendStatus.AlreadyPaid
      }

      return payResult
    }

    if (!rawRoute) {
      const reimbursed = await Wallets.reimburseFee({
        paymentFlow,
        journalId,
        actualFee: payResult.roundedUpFee,
        revealedPreImage: payResult.revealedPreImage,
      })
      if (reimbursed instanceof Error) return reimbursed
    }

    return PaymentSendStatus.Success
  })
}
