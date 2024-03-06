import {
  constructPaymentFlowBuilder,
  getPriceRatioForLimits,
  addContactsAfterSend,
} from "./helpers"

import { reimburseFee } from "./reimburse-fee"

import { AccountValidator } from "@/domain/accounts"
import {
  decodeInvoice,
  defaultTimeToExpiryInSeconds,
  LnAlreadyPaidError,
  LnPaymentPendingError,
  PaymentSendStatus,
} from "@/domain/bitcoin/lightning"
import { AlreadyPaidError, CouldNotFindLightningPaymentFlowError } from "@/domain/errors"
import { DisplayAmountsConverter } from "@/domain/fiat"
import {
  InvalidLightningPaymentFlowBuilderStateError,
  LnFees,
  LnPaymentRequestInTransitError,
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  WalletPriceRatio,
  toDisplayBaseAmount,
} from "@/domain/payments"
import {
  WalletCurrency,
  ErrorLevel,
  checkedToBtcPaymentAmount,
  checkedToUsdPaymentAmount,
} from "@/domain/shared"
import {
  checkedToWalletId,
  PaymentInitiationMethod,
  SettlementMethod,
} from "@/domain/wallets"

import { LndService } from "@/services/lnd"
import {
  LnPaymentsRepository,
  PaymentFlowStateRepository,
  WalletInvoicesRepository,
  WalletsRepository,
  UsersRepository,
  AccountsRepository,
} from "@/services/mongoose"

import { DealerPriceService } from "@/services/dealer-price"
import { LedgerService } from "@/services/ledger"
import { LockService } from "@/services/lock"
import { NotificationsService } from "@/services/notifications"

import * as LedgerFacade from "@/services/ledger/facade"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
} from "@/services/tracing"

import {
  checkIntraledgerLimits,
  checkTradeIntraAccountLimits,
  checkWithdrawalLimits,
} from "@/app/accounts"
import { getCurrentPriceAsDisplayPriceRatio } from "@/app/prices"
import {
  getTransactionForWalletByJournalId,
  getTransactionsForWalletByPaymentHash,
  validateIsBtcWallet,
  validateIsUsdWallet,
} from "@/app/wallets"

import { ResourceExpiredLockServiceError } from "@/domain/lock"

const dealer = DealerPriceService()
const paymentFlowRepo = PaymentFlowStateRepository(defaultTimeToExpiryInSeconds)

export const payInvoiceByWalletId = async ({
  uncheckedPaymentRequest,
  memo,
  senderWalletId: uncheckedSenderWalletId,
  senderAccount,
}: PayInvoiceByWalletIdArgs): Promise<PaymentSendResult | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })

  const validatedPaymentInputs = await validateInvoicePaymentInputs({
    uncheckedPaymentRequest,
    uncheckedSenderWalletId,
  })
  if (validatedPaymentInputs instanceof AlreadyPaidError) {
    const decodedInvoice = decodeInvoice(uncheckedPaymentRequest)
    if (decodedInvoice instanceof Error) return decodedInvoice
    return getAlreadyPaidResponse({
      walletId: uncheckedSenderWalletId,
      paymentHash: decodedInvoice.paymentHash,
    })
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
        senderAccount,
        memo,
      })
    : executePaymentViaLn({
        decodedInvoice,
        paymentFlow,
        senderWallet,
        senderAccount,
        senderDisplayCurrency: senderAccount.displayCurrency,
        memo,
      })
}

const payNoAmountInvoiceByWalletId = async ({
  uncheckedPaymentRequest,
  amount,
  memo,
  senderWalletId: uncheckedSenderWalletId,
  senderAccount,
}: PayNoAmountInvoiceByWalletIdArgs): Promise<PaymentSendResult | ApplicationError> => {
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
    const decodedInvoice = decodeInvoice(uncheckedPaymentRequest)
    if (decodedInvoice instanceof Error) return decodedInvoice
    return getAlreadyPaidResponse({
      walletId: uncheckedSenderWalletId,
      paymentHash: decodedInvoice.paymentHash,
    })
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
        senderAccount,
        memo,
      })
    : executePaymentViaLn({
        decodedInvoice,
        paymentFlow,
        senderWallet,
        senderAccount,
        senderDisplayCurrency: senderAccount.displayCurrency,
        memo,
      })
}

export const payNoAmountInvoiceByWalletIdForBtcWallet = async (
  args: PayNoAmountInvoiceByWalletIdArgs,
): Promise<PaymentSendResult | ApplicationError> => {
  const validated = await validateIsBtcWallet(args.senderWalletId)
  return validated instanceof Error ? validated : payNoAmountInvoiceByWalletId(args)
}

export const payNoAmountInvoiceByWalletIdForUsdWallet = async (
  args: PayNoAmountInvoiceByWalletIdArgs,
): Promise<PaymentSendResult | ApplicationError> => {
  const validated = await validateIsUsdWallet(args.senderWalletId)
  return validated instanceof Error ? validated : payNoAmountInvoiceByWalletId(args)
}

const validateInvoicePaymentInputs = async ({
  uncheckedPaymentRequest,
  uncheckedSenderWalletId,
}: {
  uncheckedPaymentRequest: string
  uncheckedSenderWalletId: string
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

  const senderAccount = await AccountsRepository().findById(senderWallet.accountId)
  if (senderAccount instanceof Error) return senderAccount

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
    "payment.finalRecipient": JSON.stringify(paymentFlow.recipientWalletDescriptor()),
  })

  return paymentFlow
}

const executePaymentViaIntraledger = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  paymentFlow,
  senderWallet,
  senderAccount,
  memo,
}: {
  paymentFlow: PaymentFlow<S, R>
  senderWallet: WalletDescriptor<S>
  senderAccount: Account
  memo: string | null
}): Promise<PaymentSendResult | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.IntraLedger,
  })

  const priceRatioForLimits = await getPriceRatioForLimits(paymentFlow.paymentAmounts())
  if (priceRatioForLimits instanceof Error) return priceRatioForLimits

  const paymentHash = paymentFlow.paymentHashForFlow()
  if (paymentHash instanceof Error) return paymentHash

  const {
    walletDescriptor: recipientWalletDescriptor,
    recipientPubkey,
    recipientUsername,
    recipientUserId,
  } = paymentFlow.recipientDetails()
  if (!(recipientWalletDescriptor && recipientUserId && recipientPubkey)) {
    return new InvalidLightningPaymentFlowBuilderStateError(
      "Expected recipient details missing",
    )
  }
  const { id: recipientWalletId } = recipientWalletDescriptor

  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet

  const recipientAccount = await AccountsRepository().findById(recipientWallet.accountId)
  if (recipientAccount instanceof Error) return recipientAccount

  const accountValidator = AccountValidator(recipientAccount)
  if (accountValidator instanceof Error) return accountValidator

  const checkLimits =
    senderWallet.accountId === recipientWallet.accountId
      ? checkTradeIntraAccountLimits
      : checkIntraledgerLimits
  const limitCheck = await checkLimits({
    amount: paymentFlow.usdPaymentAmount,
    accountId: senderWallet.accountId,
    priceRatio: priceRatioForLimits,
  })
  if (limitCheck instanceof Error) return limitCheck

  const recipientUser = await UsersRepository().findById(recipientUserId)
  if (recipientUser instanceof Error) return recipientUser

  const txRecipientNotificationArgs = {
    accountId: recipientAccount.id,
    walletId: recipientWalletDescriptor.id,
    userId: recipientUser.id,
    level: recipientAccount.level,
  }

  const senderUser = await UsersRepository().findById(senderAccount.kratosUserId)
  if (senderUser instanceof Error) return senderUser

  const txSenderNotificationArgs = {
    accountId: senderAccount.id,
    walletId: senderWallet.id,
    userId: senderUser.id,
    level: senderAccount.level,
  }

  return LockService().lockWalletId(senderWallet.id, async (signal) => {
    const ledgerService = LedgerService()

    const recorded = await ledgerService.isLnTxRecorded(paymentHash)
    if (recorded instanceof Error) return recorded
    if (recorded)
      return getAlreadyPaidResponse({
        walletId: senderWallet.id,
        paymentHash,
      })

    const balance = await ledgerService.getWalletBalanceAmount(senderWallet)
    if (balance instanceof Error) return balance

    const balanceCheck = paymentFlow.checkBalanceForSend(balance)
    if (balanceCheck instanceof Error) return balanceCheck

    const senderDisplayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
      currency: senderAccount.displayCurrency,
    })
    if (senderDisplayPriceRatio instanceof Error) return senderDisplayPriceRatio
    const { displayAmount: senderDisplayAmount, displayFee: senderDisplayFee } =
      DisplayAmountsConverter(senderDisplayPriceRatio).convert(paymentFlow)

    const recipientDisplayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
      currency: recipientAccount.displayCurrency,
    })
    if (recipientDisplayPriceRatio instanceof Error) return recipientDisplayPriceRatio
    const { displayAmount: recipientDisplayAmount, displayFee: recipientDisplayFee } =
      DisplayAmountsConverter(recipientDisplayPriceRatio).convert(paymentFlow)

    if (signal.aborted) {
      return new ResourceExpiredLockServiceError(signal.error?.message)
    }

    let metadata:
      | AddLnIntraledgerSendLedgerMetadata
      | AddLnTradeIntraAccountLedgerMetadata
    let additionalDebitMetadata: {
      [key: string]:
        | Username
        | DisplayCurrencyBaseAmount
        | DisplayCurrency
        | string
        | undefined
    } = {}
    let additionalCreditMetadata: {
      [key: string]: Username | DisplayCurrencyBaseAmount | DisplayCurrency | undefined
    } = {}
    let additionalInternalMetadata: {
      [key: string]: DisplayCurrencyBaseAmount | DisplayCurrency | undefined
    } = {}
    if (senderWallet.accountId === recipientWallet.accountId) {
      ;({
        metadata,
        debitAccountAdditionalMetadata: additionalDebitMetadata,
        creditAccountAdditionalMetadata: additionalCreditMetadata,
        internalAccountsAdditionalMetadata: additionalInternalMetadata,
      } = LedgerFacade.LnTradeIntraAccountLedgerMetadata({
        paymentHash,
        pubkey: recipientPubkey,
        paymentAmounts: paymentFlow,

        senderAmountDisplayCurrency: toDisplayBaseAmount(senderDisplayAmount),
        senderFeeDisplayCurrency: toDisplayBaseAmount(senderDisplayFee),
        senderDisplayCurrency: senderAccount.displayCurrency,

        memoOfPayer: memo || undefined,
      }))
    } else {
      ;({
        metadata,
        debitAccountAdditionalMetadata: additionalDebitMetadata,
        creditAccountAdditionalMetadata: additionalCreditMetadata,
        internalAccountsAdditionalMetadata: additionalInternalMetadata,
      } = LedgerFacade.LnIntraledgerLedgerMetadata({
        paymentHash,
        pubkey: recipientPubkey,
        paymentAmounts: paymentFlow,

        senderAmountDisplayCurrency: toDisplayBaseAmount(senderDisplayAmount),
        senderFeeDisplayCurrency: toDisplayBaseAmount(senderDisplayFee),
        senderDisplayCurrency: senderAccount.displayCurrency,

        recipientAmountDisplayCurrency: toDisplayBaseAmount(recipientDisplayAmount),
        recipientFeeDisplayCurrency: toDisplayBaseAmount(recipientDisplayFee),
        recipientDisplayCurrency: recipientAccount.displayCurrency,

        memoOfPayer: memo || undefined,
        senderUsername: senderAccount.username,
        recipientUsername,
      }))
    }

    const senderWalletDescriptor = paymentFlow.senderWalletDescriptor()
    const journal = await LedgerFacade.recordIntraledger({
      description: paymentFlow.descriptionFromInvoice,
      amount: {
        btc: paymentFlow.btcPaymentAmount,
        usd: paymentFlow.usdPaymentAmount,
      },
      senderWalletDescriptor,
      recipientWalletDescriptor,
      metadata,
      additionalDebitMetadata,
      additionalCreditMetadata,
      additionalInternalMetadata,
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

    const recipientWalletTransaction = await getTransactionForWalletByJournalId({
      walletId: txRecipientNotificationArgs.walletId,
      journalId: journal.journalId,
    })
    if (recipientWalletTransaction instanceof Error) return recipientWalletTransaction
    NotificationsService().sendTransaction({
      recipient: txRecipientNotificationArgs,
      transaction: recipientWalletTransaction,
    })

    const senderWalletTransaction = await getTransactionForWalletByJournalId({
      walletId: txSenderNotificationArgs.walletId,
      journalId: journal.journalId,
    })
    if (senderWalletTransaction instanceof Error) return senderWalletTransaction
    NotificationsService().sendTransaction({
      recipient: txSenderNotificationArgs,
      transaction: senderWalletTransaction,
    })

    if (senderAccount.id !== recipientAccount.id) {
      const addContactResult = await addContactsAfterSend({
        senderAccount,
        recipientAccount,
      })
      if (addContactResult instanceof Error) {
        recordExceptionInCurrentSpan({
          error: addContactResult,
          level: ErrorLevel.Warn,
        })
      }
    }

    return {
      status: PaymentSendStatus.Success,
      transaction: senderWalletTransaction,
    }
  })
}

const executePaymentViaLn = async ({
  decodedInvoice,
  paymentFlow,
  senderWallet,
  senderAccount,
  senderDisplayCurrency,
  memo,
}: {
  decodedInvoice: LnInvoice
  paymentFlow: PaymentFlow<WalletCurrency, WalletCurrency>
  senderWallet: Wallet
  senderAccount: Account
  senderDisplayCurrency: DisplayCurrency
  memo: string | null
}): Promise<PaymentSendResult | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.Lightning,
  })

  const priceRatioForLimits = await getPriceRatioForLimits(paymentFlow.paymentAmounts())
  if (priceRatioForLimits instanceof Error) return priceRatioForLimits

  const limitCheck = await checkWithdrawalLimits({
    amount: paymentFlow.usdPaymentAmount,
    accountId: senderWallet.accountId,
    priceRatio: priceRatioForLimits,
  })
  if (limitCheck instanceof Error) return limitCheck

  const { paymentHash } = decodedInvoice

  const { rawRoute, outgoingNodePubkey } = paymentFlow.routeDetails()

  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountId(senderAccount.id)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors
  const walletIds = [accountWalletDescriptors.BTC.id, accountWalletDescriptors.USD.id]

  const senderUser = await UsersRepository().findById(senderAccount.kratosUserId)
  if (senderUser instanceof Error) return senderUser

  const txSenderNotificationArgs = {
    accountId: senderWallet.accountId,
    walletId: senderWallet.id,
    userId: senderUser.id,
    level: senderAccount.level,
  }

  return LockService().lockWalletId(senderWallet.id, async (signal) => {
    // Execute checks before payment
    const ledgerService = LedgerService()

    const ledgerTransactions = await ledgerService.getTransactionsByHash(paymentHash)
    if (ledgerTransactions instanceof Error) return ledgerTransactions

    const pendingPayment = ledgerTransactions.find((tx) => tx.pendingConfirmation)
    if (pendingPayment) return new LnPaymentRequestInTransitError()

    const balance = await ledgerService.getWalletBalanceAmount(senderWallet)
    if (balance instanceof Error) return balance
    const balanceCheck = paymentFlow.checkBalanceForSend(balance)
    if (balanceCheck instanceof Error) return balanceCheck

    // Prepare ledger transaction
    const lndService = LndService()
    if (lndService instanceof Error) return lndService

    const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
      currency: senderDisplayCurrency,
    })
    if (displayPriceRatio instanceof Error) return displayPriceRatio
    const { displayAmount, displayFee } =
      DisplayAmountsConverter(displayPriceRatio).convert(paymentFlow)

    if (signal.aborted) {
      return new ResourceExpiredLockServiceError(signal.error?.message)
    }

    const {
      metadata,
      debitAccountAdditionalMetadata,
      internalAccountsAdditionalMetadata,
    } = LedgerFacade.LnSendLedgerMetadata({
      amountDisplayCurrency: toDisplayBaseAmount(displayAmount),
      feeDisplayCurrency: toDisplayBaseAmount(displayFee),
      displayCurrency: senderDisplayCurrency,

      paymentAmounts: paymentFlow,
      pubkey: outgoingNodePubkey || lndService.defaultPubkey(),
      paymentHash,
      feeKnownInAdvance: !!rawRoute,

      memoOfPayer: memo || paymentFlow.descriptionFromInvoice,
    })

    const walletPriceRatio = WalletPriceRatio({
      usd: paymentFlow.usdPaymentAmount,
      btc: paymentFlow.btcPaymentAmount,
    })
    if (walletPriceRatio instanceof Error) return walletPriceRatio

    // Record pending payment entries
    const journal = await LedgerFacade.recordSendOffChain({
      description: paymentFlow.descriptionFromInvoice || memo || "",
      amountToDebitSender: {
        btc: {
          currency: paymentFlow.btcPaymentAmount.currency,
          amount:
            paymentFlow.btcPaymentAmount.amount +
            paymentFlow.btcProtocolAndBankFee.amount,
        },
        usd: {
          currency: paymentFlow.usdPaymentAmount.currency,
          amount:
            paymentFlow.usdPaymentAmount.amount +
            paymentFlow.usdProtocolAndBankFee.amount,
        },
      },
      senderWalletDescriptor: paymentFlow.senderWalletDescriptor(),
      metadata,
      additionalDebitMetadata: debitAccountAdditionalMetadata,
      additionalInternalMetadata: internalAccountsAdditionalMetadata,
    })
    if (journal instanceof Error) return journal
    const { journalId } = journal

    const updateStateAfterSend = await LedgerFacade.updateLnPaymentState({
      walletIds,
      paymentHash,
      journalId,
    })
    if (updateStateAfterSend instanceof Error) return updateStateAfterSend

    // Execute payment
    let payResult: PayInvoiceResult | LightningServiceError
    if (rawRoute) {
      payResult = await lndService.payInvoiceViaRoutes({
        paymentHash,
        rawRoute,
        pubkey: outgoingNodePubkey,
      })
    } else {
      const maxFeeCheckArgs = {
        maxFeeAmount: paymentFlow.btcProtocolAndBankFee,
        btcPaymentAmount: paymentFlow.btcPaymentAmount,
        usdPaymentAmount: paymentFlow.usdPaymentAmount,
        priceRatio: walletPriceRatio,
        senderWalletCurrency: paymentFlow.senderWalletDescriptor().currency,
        isFromNoAmountInvoice:
          decodedInvoice.amount === 0 || decodedInvoice.amount === null,
      }
      const maxFeeCheck = LnFees().verifyMaxFee(maxFeeCheckArgs)

      payResult =
        maxFeeCheck instanceof Error
          ? maxFeeCheck
          : await lndService.payInvoiceViaPaymentDetails({
              ...maxFeeCheckArgs,
              decodedInvoice,
            })
    }

    if (!(payResult instanceof LnAlreadyPaidError)) {
      await LnPaymentsRepository().persistNew({
        paymentHash: decodedInvoice.paymentHash,
        paymentRequest: decodedInvoice.paymentRequest,
        sentFromPubkey: outgoingNodePubkey || lndService.defaultPubkey(),
      })

      if (!(payResult instanceof Error))
        await LedgerFacade.updateMetadataByHash({
          hash: paymentHash,
          revealedPreImage: payResult.revealedPreImage,
        })
    }
    if (payResult instanceof LnPaymentPendingError) {
      paymentFlow.paymentSentAndPending = true
      const updateResult = await paymentFlowRepo.updateLightningPaymentFlow(paymentFlow)
      if (updateResult instanceof Error) {
        recordExceptionInCurrentSpan({ error: updateResult })
      }

      const walletTransaction = await getTransactionForWalletByJournalId({
        walletId: txSenderNotificationArgs.walletId,
        journalId: journal.journalId,
      })
      if (walletTransaction instanceof Error) return walletTransaction
      NotificationsService().sendTransaction({
        recipient: txSenderNotificationArgs,
        transaction: walletTransaction,
      })

      return getPendingPaymentResponse({
        walletId: senderWallet.id,
        paymentHash,
      })
    }

    // Settle and record reversion entries
    if (payResult instanceof Error) {
      const settled = await LedgerFacade.settlePendingLnSend(paymentHash)
      if (settled instanceof Error) return settled

      const voided = await LedgerFacade.recordLnSendRevert({
        journalId,
        paymentHash,
      })
      if (voided instanceof Error) return voided

      const updateStateAfterRevert = await LedgerFacade.updateLnPaymentState({
        walletIds,
        paymentHash,
        journalId,
      })
      if (updateStateAfterRevert instanceof Error) return updateStateAfterRevert

      const walletTransaction = await getTransactionForWalletByJournalId({
        walletId: txSenderNotificationArgs.walletId,
        journalId: journal.journalId,
      })
      if (walletTransaction instanceof Error) return walletTransaction
      NotificationsService().sendTransaction({
        recipient: txSenderNotificationArgs,
        transaction: walletTransaction,
      })

      return payResult instanceof LnAlreadyPaidError
        ? getAlreadyPaidResponse({
            walletId: senderWallet.id,
            paymentHash,
          })
        : payResult
    }

    // Settle and conditionally record reimbursement entries
    const settled = await LedgerFacade.settlePendingLnSend(paymentHash)
    if (settled instanceof Error) return settled

    if (!rawRoute) {
      const reimbursed = await reimburseFee({
        paymentFlow,
        senderDisplayAmount: toDisplayBaseAmount(displayAmount),
        senderDisplayCurrency,
        journalId,
        actualFee: payResult.roundedUpFee,
        revealedPreImage: payResult.revealedPreImage,
      })
      if (reimbursed instanceof Error) return reimbursed
    }

    const updateStateAfterSettle = await LedgerFacade.updateLnPaymentState({
      walletIds,
      paymentHash,
      journalId,
    })
    if (updateStateAfterSettle instanceof Error) return updateStateAfterSettle

    const walletTransaction = await getTransactionForWalletByJournalId({
      walletId: txSenderNotificationArgs.walletId,
      journalId: journal.journalId,
    })
    if (walletTransaction instanceof Error) return walletTransaction
    NotificationsService().sendTransaction({
      recipient: txSenderNotificationArgs,
      transaction: walletTransaction,
    })

    return {
      status: PaymentSendStatus.Success,
      transaction: walletTransaction,
    }
  })
}

const getAlreadyPaidResponse = async ({
  walletId,
  paymentHash,
}: {
  walletId: WalletId
  paymentHash: PaymentHash
}): Promise<PaymentSendResult | ApplicationError> =>
  getPaymentSendResponse({
    walletId,
    paymentHash,
    status: PaymentSendStatus.AlreadyPaid,
  })

const getPendingPaymentResponse = async ({
  walletId,
  paymentHash,
}: {
  walletId: WalletId
  paymentHash: PaymentHash
}): Promise<PaymentSendResult | ApplicationError> =>
  getPaymentSendResponse({
    walletId,
    paymentHash,
    status: PaymentSendStatus.Pending,
  })

const getPaymentSendResponse = async ({
  walletId,
  paymentHash,
  status,
}: {
  walletId: WalletId
  paymentHash: PaymentHash
  status: PaymentSendStatus
}): Promise<PaymentSendResult | ApplicationError> => {
  const transactions = await getTransactionsForWalletByPaymentHash({
    walletId,
    paymentHash,
  })
  if (transactions instanceof Error) return transactions
  return {
    status,
    transaction: transactions.find((t) => t.settlementAmount < 0) || transactions[0],
  }
}
