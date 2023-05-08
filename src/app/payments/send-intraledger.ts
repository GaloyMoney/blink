import { getValuesToSkipProbe } from "@config"

import { AccountValidator } from "@domain/accounts"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import { displayAmountFromNumber } from "@domain/fiat"
import {
  InvalidLightningPaymentFlowBuilderStateError,
  InvalidZeroAmountPriceRatioInputError,
  LightningPaymentFlowBuilder,
  ZeroAmountForUsdRecipientError,
} from "@domain/payments"
import { ErrorLevel, WalletCurrency } from "@domain/shared"
import { checkedToWalletId, SettlementMethod } from "@domain/wallets"

import { DealerPriceService } from "@services/dealer-price"
import { LedgerService } from "@services/ledger"
import * as LedgerFacade from "@services/ledger/facade"
import { LockService } from "@services/lock"
import {
  AccountsRepository,
  WalletsRepository,
  UsersRepository,
} from "@services/mongoose"
import { NotificationsService } from "@services/notifications"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
} from "@services/tracing"

import { ResourceExpiredLockServiceError } from "@domain/lock"

import {
  btcFromUsdMidPriceFn,
  getCurrentPriceAsDisplayPriceRatio,
  usdFromBtcMidPriceFn,
} from "@app/prices"
import { validateIsBtcWallet, validateIsUsdWallet } from "@app/wallets"

import {
  getPriceRatioForLimits,
  checkIntraledgerLimits,
  checkTradeIntraAccountLimits,
  addContactsAfterSend,
} from "./helpers"

const dealer = DealerPriceService()

const intraledgerPaymentSendWalletId = async ({
  recipientWalletId: uncheckedRecipientWalletId,
  senderAccount,
  amount: uncheckedAmount,
  memo,
  senderWalletId: uncheckedSenderWalletId,
}: IntraLedgerPaymentSendWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  const validatedPaymentInputs = await validateIntraledgerPaymentInputs({
    uncheckedSenderWalletId,
    uncheckedRecipientWalletId,
    senderAccount,
  })
  if (validatedPaymentInputs instanceof Error) return validatedPaymentInputs

  const { senderWallet, recipientWallet, recipientAccount } = validatedPaymentInputs

  const { id: recipientWalletId, currency: recipientWalletCurrency } = recipientWallet
  const {
    id: recipientAccountId,
    username: recipientUsername,
    kratosUserId: recipientUserId,
  } = recipientAccount

  const paymentBuilder = LightningPaymentFlowBuilder({
    localNodeIds: [],
    skipProbe: getValuesToSkipProbe(),
  })
  const builderWithInvoice = paymentBuilder.withoutInvoice({
    uncheckedAmount,
    description: memo || "",
  })

  const builderWithSenderWallet = builderWithInvoice.withSenderWallet(senderWallet)

  const recipientDetailsForBuilder = {
    id: recipientWalletId,
    currency: recipientWalletCurrency,
    accountId: recipientAccountId,
    username: recipientUsername,
    userId: recipientUserId,
    pubkey: undefined,
    usdPaymentAmount: undefined,
  }

  const builderAfterRecipientStep = builderWithSenderWallet.withRecipientWallet(
    recipientDetailsForBuilder,
  )

  const builderWithConversion = builderAfterRecipientStep.withConversion({
    mid: { usdFromBtc: usdFromBtcMidPriceFn, btcFromUsd: btcFromUsdMidPriceFn },
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

  const paymentFlow = await builderWithConversion.withoutRoute()
  if (paymentFlow instanceof InvalidZeroAmountPriceRatioInputError) {
    return new ZeroAmountForUsdRecipientError()
  }
  if (paymentFlow instanceof Error) return paymentFlow

  addAttributesToCurrentSpan({
    "payment.intraLedger.inputAmount": paymentFlow.inputAmount.toString(),
    "payment.intraLedger.hash": paymentFlow.intraLedgerHash,
    "payment.intraLedger.description": memo || "",
  })

  const paymentSendStatus = await executePaymentViaIntraledger({
    paymentFlow,
    senderAccount,
    senderWallet,
    recipientAccount,
    recipientWallet,
    memo,
  })
  if (paymentSendStatus instanceof Error) return paymentSendStatus

  if (senderAccount.id !== recipientAccount.id) {
    const addContactResult = await addContactsAfterSend({
      senderAccount,
      recipientAccount,
    })
    if (addContactResult instanceof Error) {
      recordExceptionInCurrentSpan({ error: addContactResult, level: ErrorLevel.Warn })
    }
  }

  return paymentSendStatus
}

export const intraledgerPaymentSendWalletIdForBtcWallet = async (
  args: IntraLedgerPaymentSendWalletIdArgs,
): Promise<PaymentSendStatus | ApplicationError> => {
  const validated = await validateIsBtcWallet(args.senderWalletId)
  return validated instanceof Error ? validated : intraledgerPaymentSendWalletId(args)
}

export const intraledgerPaymentSendWalletIdForUsdWallet = async (
  args: IntraLedgerPaymentSendWalletIdArgs,
): Promise<PaymentSendStatus | ApplicationError> => {
  const validated = await validateIsUsdWallet(args.senderWalletId)
  return validated instanceof Error ? validated : intraledgerPaymentSendWalletId(args)
}

const validateIntraledgerPaymentInputs = async ({
  uncheckedSenderWalletId,
  uncheckedRecipientWalletId,
  senderAccount,
}: {
  uncheckedSenderWalletId: string
  uncheckedRecipientWalletId: string
  senderAccount: Account
}): Promise<
  | { senderWallet: Wallet; recipientWallet: Wallet; recipientAccount: Account }
  | ApplicationError
> => {
  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return senderWalletId

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  const accountValidator = AccountValidator(senderAccount)
  if (accountValidator instanceof Error) return accountValidator
  const validateWallet = accountValidator.validateWalletForAccount(senderWallet)
  if (validateWallet instanceof Error) return validateWallet

  const recipientWalletId = checkedToWalletId(uncheckedRecipientWalletId)
  if (recipientWalletId instanceof Error) return recipientWalletId

  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet
  const { accountId: recipientAccountId } = recipientWallet

  const recipientAccount = await AccountsRepository().findById(recipientAccountId)
  if (recipientAccount instanceof Error) return recipientAccount

  addAttributesToCurrentSpan({
    "payment.intraLedger.senderWalletId": senderWalletId,
    "payment.intraLedger.senderWalletCurrency": senderWallet.currency,
    "payment.intraLedger.recipientWalletId": recipientWalletId,
    "payment.intraLedger.recipientWalletCurrency": recipientWallet.currency,
  })

  return {
    senderWallet,
    recipientWallet,
    recipientAccount,
  }
}

const executePaymentViaIntraledger = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  paymentFlow,
  senderAccount,
  senderWallet,
  recipientAccount,
  recipientWallet,
  memo,
}: {
  paymentFlow: PaymentFlow<S, R>
  senderAccount: Account
  senderWallet: WalletDescriptor<S>
  recipientAccount: Account
  recipientWallet: WalletDescriptor<R>
  memo: string | null
}): Promise<PaymentSendStatus | ApplicationError> => {
  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.IntraLedger,
  })

  const priceRatioForLimits = await getPriceRatioForLimits(paymentFlow.paymentAmounts())
  if (priceRatioForLimits instanceof Error) return priceRatioForLimits

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

  const { walletDescriptor: recipientWalletDescriptor, recipientUsername } =
    paymentFlow.recipientDetails()
  if (!recipientWalletDescriptor) {
    return new InvalidLightningPaymentFlowBuilderStateError(
      "Expected recipient details missing",
    )
  }
  const { currency: recipientWalletCurrency } = recipientWalletDescriptor

  return LockService().lockWalletId(senderWallet.id, async (signal) => {
    const balance = await LedgerService().getWalletBalanceAmount(senderWallet)
    if (balance instanceof Error) return balance

    const balanceCheck = paymentFlow.checkBalanceForSend(balance)
    if (balanceCheck instanceof Error) return balanceCheck

    const { displayCurrency: senderDisplayCurrency } = senderAccount
    const senderDisplayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
      currency: senderDisplayCurrency,
    })
    if (senderDisplayPriceRatio instanceof Error) return senderDisplayPriceRatio
    const senderAmountDisplayCurrencyAsNumber = Number(
      senderDisplayPriceRatio.convertFromWallet(paymentFlow.btcPaymentAmount)
        .amountInMinor,
    ) as DisplayCurrencyBaseAmount

    const recipientDisplayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
      currency: recipientAccount.displayCurrency,
    })
    if (recipientDisplayPriceRatio instanceof Error) return recipientDisplayPriceRatio
    const recipientAmountDisplayCurrencyAsNumber = Number(
      recipientDisplayPriceRatio.convertFromWallet(paymentFlow.btcPaymentAmount)
        .amountInMinor,
    ) as DisplayCurrencyBaseAmount

    if (signal.aborted) {
      return new ResourceExpiredLockServiceError(signal.error?.message)
    }

    let metadata:
      | AddWalletIdIntraledgerSendLedgerMetadata
      | AddWalletIdTradeIntraAccountLedgerMetadata
    let additionalDebitMetadata: {
      [key: string]: Username | DisplayCurrencyBaseAmount | DisplayCurrency | undefined
    } = {}
    let additionalCreditMetadata: {
      [key: string]: DisplayCurrencyBaseAmount | DisplayCurrency | undefined
    }
    let additionalInternalMetadata: {
      [key: string]: DisplayCurrencyBaseAmount | DisplayCurrency | undefined
    } = {}
    if (senderWallet.accountId === recipientWallet.accountId) {
      ;({
        metadata,
        debitAccountAdditionalMetadata: additionalDebitMetadata,
        creditAccountAdditionalMetadata: additionalCreditMetadata,
        internalAccountsAdditionalMetadata: additionalInternalMetadata,
      } = LedgerFacade.WalletIdTradeIntraAccountLedgerMetadata({
        paymentAmounts: paymentFlow,

        senderAmountDisplayCurrency: senderAmountDisplayCurrencyAsNumber,
        senderFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
        senderDisplayCurrency: senderDisplayCurrency,

        memoOfPayer: memo || undefined,
      }))
    } else {
      ;({
        metadata,
        debitAccountAdditionalMetadata: additionalDebitMetadata,
        creditAccountAdditionalMetadata: additionalCreditMetadata,
        internalAccountsAdditionalMetadata: additionalInternalMetadata,
      } = LedgerFacade.WalletIdIntraledgerLedgerMetadata({
        paymentAmounts: paymentFlow,

        senderAmountDisplayCurrency: senderAmountDisplayCurrencyAsNumber,
        senderFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
        senderDisplayCurrency: senderDisplayCurrency,

        recipientAmountDisplayCurrency: recipientAmountDisplayCurrencyAsNumber,
        recipientFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
        recipientDisplayCurrency: recipientAccount.displayCurrency,

        memoOfPayer: memo || undefined,
        senderUsername: senderAccount.username,
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
      additionalCreditMetadata,
      additionalInternalMetadata,
    })
    if (journal instanceof Error) return journal

    const totalSendAmounts = paymentFlow.totalAmountsForPayment()

    const recipientUser = await UsersRepository().findById(recipientAccount.kratosUserId)
    if (recipientUser instanceof Error) return recipientUser

    let amount = totalSendAmounts.btc.amount
    if (recipientWalletCurrency === WalletCurrency.Usd) {
      amount = totalSendAmounts.usd.amount
    }

    const recipientDisplayAmount = displayAmountFromNumber({
      amount: recipientAmountDisplayCurrencyAsNumber,
      currency: recipientAccount.displayCurrency,
    })
    if (recipientDisplayAmount instanceof Error) return recipientDisplayAmount

    const notificationsService = NotificationsService()
    notificationsService.intraLedgerTxReceived({
      recipientAccountId: recipientWallet.accountId,
      recipientWalletId: recipientWallet.id,
      recipientDeviceTokens: recipientUser.deviceTokens,
      recipientLanguage: recipientUser.language,
      paymentAmount: { amount, currency: recipientWallet.currency },
      displayPaymentAmount: recipientDisplayAmount,
    })

    return PaymentSendStatus.Success
  })
}
