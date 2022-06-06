import { WalletCurrency } from "@domain/shared"
import {
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
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
import {
  decodeInvoice,
  defaultTimeToExpiryInSeconds,
  LnAlreadyPaidError,
  LnPaymentPendingError,
  PaymentSendStatus,
} from "@domain/bitcoin/lightning"
import { TwoFA, TwoFANewCodeNeededError } from "@domain/twoFA"
import { DisplayCurrency, NewDisplayCurrencyConverter } from "@domain/fiat"
import { AlreadyPaidError, CouldNotFindLightningPaymentFlowError } from "@domain/errors"

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

import { ResourceExpiredLockServiceError } from "@domain/lock"

import {
  constructPaymentFlowBuilder,
  newCheckWithdrawalLimits,
  newCheckIntraledgerLimits,
  newCheckTwoFALimits,
  getPriceRatioForLimits,
} from "./helpers"

const dealer = NewDealerPriceService()
const paymentFlowRepo = PaymentFlowStateRepository(defaultTimeToExpiryInSeconds)

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
  if (validatedPaymentInputs instanceof AlreadyPaidError) {
    return PaymentSendStatus.AlreadyPaid
  }
  if (validatedPaymentInputs instanceof Error) {
    return validatedPaymentInputs
  }
  const { senderWallet, paymentFlow, decodedInvoice } = validatedPaymentInputs

  const user = await UsersRepository().findById(senderAccount.ownerId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const priceRatioForLimits = await getPriceRatioForLimits(paymentFlow)
  if (priceRatioForLimits instanceof Error) return priceRatioForLimits

  const twoFACheck = twoFA?.secret
    ? await newCheckAndVerifyTwoFA({
        amount: paymentFlow.usdPaymentAmount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        wallet: senderWallet,
        priceRatio: priceRatioForLimits,
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
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })

  const validatedPaymentInputs = await validateInvoicePaymentInputs({
    paymentRequest,
    uncheckedSenderWalletId,
    senderAccount,
  })
  if (validatedPaymentInputs instanceof AlreadyPaidError) {
    return PaymentSendStatus.AlreadyPaid
  }
  if (validatedPaymentInputs instanceof Error) {
    return validatedPaymentInputs
  }
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
  if (validatedNoAmountPaymentInputs instanceof AlreadyPaidError) {
    return PaymentSendStatus.AlreadyPaid
  }
  if (validatedNoAmountPaymentInputs instanceof Error) {
    return validatedNoAmountPaymentInputs
  }
  const { senderWallet, paymentFlow, decodedInvoice } = validatedNoAmountPaymentInputs

  const user = await UsersRepository().findById(senderAccount.ownerId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const priceRatioForLimits = await getPriceRatioForLimits(paymentFlow)
  if (priceRatioForLimits instanceof Error) return priceRatioForLimits

  const twoFACheck = twoFA?.secret
    ? await newCheckAndVerifyTwoFA({
        amount: paymentFlow.usdPaymentAmount,
        twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
        twoFASecret: twoFA.secret,
        wallet: senderWallet,
        priceRatio: priceRatioForLimits,
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
  addAttributesToCurrentSpan({
    "payment.initiation_method": PaymentInitiationMethod.Lightning,
  })

  const validatedNoAmountPaymentInputs = await validateNoAmountInvoicePaymentInputs({
    paymentRequest,
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
}: {
  paymentRequest: EncodedPaymentRequest
  uncheckedSenderWalletId: string
  senderAccount: Account
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

  const accountValidator = AccountValidator(senderAccount)
  if (accountValidator instanceof Error) return accountValidator
  const validateWallet = accountValidator.validateWalletForAccount(senderWallet)
  if (validateWallet instanceof Error) return validateWallet

  let paymentFlow = await paymentFlowRepo.findLightningPaymentFlow({
    walletId: senderWalletId,
    paymentHash: decodedInvoice.paymentHash,
    inputAmount: lnInvoiceAmount.amount,
  })
  addAttributesToCurrentSpan({
    "payment.paymentFlow.existsFromProbe": !(
      paymentFlow instanceof CouldNotFindLightningPaymentFlowError
    ),
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
    if (paymentFlow instanceof Error) return paymentFlow

    const persistedPayment = await paymentFlowRepo.persistNew(paymentFlow)
    if (persistedPayment instanceof Error) return persistedPayment
  }
  if (paymentFlow instanceof Error) return paymentFlow

  addAttributesToCurrentSpan({
    "payment.amount": paymentFlow.btcPaymentAmount.amount.toString(),
    "payment.request.destination": decodedInvoice.destination,
    "payment.request.hash": decodedInvoice.paymentHash,
    "payment.request.description": decodedInvoice.description,
    "payment.request.expiresAt": decodedInvoice.expiresAt
      ? decodedInvoice.expiresAt.toISOString()
      : "undefined",
  })

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
}: {
  paymentRequest: EncodedPaymentRequest
  amount: number
  uncheckedSenderWalletId: string
  senderAccount: Account
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

  const accountValidator = AccountValidator(senderAccount)
  if (accountValidator instanceof Error) return accountValidator
  const validateWallet = accountValidator.validateWalletForAccount(senderWallet)
  if (validateWallet instanceof Error) return validateWallet

  const inputPaymentAmount =
    senderWallet.currency === WalletCurrency.Btc
      ? checkedToBtcPaymentAmount(amount)
      : checkedToUsdPaymentAmount(amount)
  if (inputPaymentAmount instanceof Error) return inputPaymentAmount

  let paymentFlow = await paymentFlowRepo.findLightningPaymentFlow({
    walletId: senderWalletId,
    paymentHash: decodedInvoice.paymentHash,
    inputAmount: inputPaymentAmount.amount,
  })
  addAttributesToCurrentSpan({
    "payment.paymentFlow.existsFromProbe": !(
      paymentFlow instanceof CouldNotFindLightningPaymentFlowError
    ),
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
    if (paymentFlow instanceof Error) return paymentFlow

    const persistedPayment = await paymentFlowRepo.persistNew(paymentFlow)
    if (persistedPayment instanceof Error) return persistedPayment
  }
  if (paymentFlow instanceof Error) return paymentFlow

  addAttributesToCurrentSpan({
    "payment.amount": paymentFlow.btcPaymentAmount.amount.toString(),
    "payment.request.destination": decodedInvoice.destination,
    "payment.request.hash": decodedInvoice.paymentHash,
    "payment.request.description": decodedInvoice.description,
    "payment.request.expiresAt": decodedInvoice.expiresAt
      ? decodedInvoice.expiresAt.toISOString()
      : "undefined",
  })

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
  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.IntraLedger,
  })

  const priceRatioForLimits = await getPriceRatioForLimits(paymentFlow)
  if (priceRatioForLimits instanceof Error) return priceRatioForLimits

  const limitCheck = await newCheckIntraledgerLimits({
    amount: paymentFlow.usdPaymentAmount,
    wallet: senderWallet,
    priceRatio: priceRatioForLimits,
  })
  if (limitCheck instanceof Error) return limitCheck

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

  return LockService().lockWalletId(senderWallet.id, async (signal) => {
    const balance = await LedgerService().getWalletBalanceAmount(senderWallet)
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

    const lnIntraLedgerMetadata = LedgerFacade.LnIntraledgerLedgerMetadata({
      paymentHash,
      pubkey: recipientPubkey,
      paymentFlow,

      amountDisplayCurrency: converter.fromUsdAmount(paymentFlow.usdPaymentAmount),
      feeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
      displayCurrency: DisplayCurrency.Usd,

      memoOfPayer: memo || undefined,
      senderUsername,
      recipientUsername,
    })
    const { metadata, debitAccountAdditionalMetadata: additionalDebitMetadata } =
      lnIntraLedgerMetadata

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

    const notificationsService = NotificationsService(logger)
    if (recipientWalletCurrency === WalletCurrency.Btc) {
      notificationsService.lnInvoiceBitcoinWalletPaid({
        paymentHash,
        recipientWalletId,
        sats: paymentFlow.btcPaymentAmount.amount,
        displayCurrencyPerSat: priceRatio.usdPerSat() as unknown as DisplayCurrencyPerSat,
      })
    } else {
      notificationsService.lnInvoiceUsdWalletPaid({
        paymentHash,
        recipientWalletId,
        cents: paymentFlow.usdPaymentAmount.amount,
      })
    }

    return PaymentSendStatus.Success
  })
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
    const balance = await LedgerService().getWalletBalanceAmount(senderWallet)
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
        logger,
      })
      if (reimbursed instanceof Error) return reimbursed
    }

    return PaymentSendStatus.Success
  })
}
