import { ErrorLevel, WalletCurrency } from "@domain/shared"
import { checkedToWalletId, SettlementMethod } from "@domain/wallets"
import { AccountValidator } from "@domain/accounts"
import { DisplayCurrency, NewDisplayCurrencyConverter } from "@domain/fiat"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import {
  InvalidLightningPaymentFlowBuilderStateError,
  LightningPaymentFlowBuilder,
  NoRecipientDetailsForIntraLedgerFlowError,
  PriceRatio,
} from "@domain/payments"

import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
} from "@services/tracing"
import { NewDealerPriceService } from "@services/dealer-price"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { LockService } from "@services/lock"
import { LedgerService } from "@services/ledger"
import * as LedgerFacade from "@services/ledger/facade"
import { LndService } from "@services/lnd"
import { NotificationsService } from "@services/notifications"

import { Accounts } from "@app"

import {
  newCheckIntraledgerLimits,
  btcFromUsdMidPriceFn,
  usdFromBtcMidPriceFn,
} from "./helpers"

const dealer = NewDealerPriceService()

export const intraledgerPaymentSendWalletId = async ({
  recipientWalletId: uncheckedRecipientWalletId,
  senderAccount,
  amount: uncheckedAmount,
  memo,
  senderWalletId: uncheckedSenderWalletId,
  logger,
}: IntraLedgerPaymentSendWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  const validatedPaymentInputs = await validateIntraledgerPaymentInputs({
    uncheckedAmount,
    uncheckedSenderWalletId,
    uncheckedRecipientWalletId,
    memo,
    senderAccount,
  })
  if (validatedPaymentInputs instanceof Error) return validatedPaymentInputs

  const { senderWallet, paymentFlow, recipientAccountId, recipientUsername } =
    validatedPaymentInputs

  const paymentSendStatus = await executePaymentViaIntraledger({
    paymentFlow,
    senderWallet,
    logger,
    senderUsername: senderAccount.username,
    memo,
  })
  if (paymentSendStatus instanceof Error) return paymentSendStatus

  const addContactResult = await addContactsAfterSend({
    senderAccountId: senderAccount.id,
    senderUsername: senderAccount.username,
    recipientAccountId,
    recipientUsername,
  })
  if (addContactResult instanceof Error) {
    recordExceptionInCurrentSpan({ error: addContactResult, level: ErrorLevel.Warn })
  }

  return paymentSendStatus
}

const validateIntraledgerPaymentInputs = async ({
  uncheckedAmount,
  uncheckedSenderWalletId,
  uncheckedRecipientWalletId,
  memo,
  senderAccount,
}) => {
  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return senderWalletId

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  const accountValidated = AccountValidator().validateAccount({
    account: senderAccount,
    accountIdFromWallet: senderWallet.accountId,
  })
  if (accountValidated instanceof Error) return accountValidated

  const recipientWalletId = checkedToWalletId(uncheckedRecipientWalletId)
  if (recipientWalletId instanceof Error) return recipientWalletId

  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet
  const { accountId: recipientAccountId, currency: recipientWalletCurrency } =
    recipientWallet

  const recipientAccount = await AccountsRepository().findById(recipientAccountId)
  if (recipientAccount instanceof Error) return recipientAccount
  const { username: recipientUsername } = recipientAccount

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const paymentBuilder = LightningPaymentFlowBuilder({
    localNodeIds: lndService.listAllPubkeys(),
    usdFromBtcMidPriceFn,
    btcFromUsdMidPriceFn,
  })
  const builderWithInvoice = paymentBuilder.withoutInvoice({
    uncheckedAmount,
    description: memo,
  })

  const builderWithSenderWallet = builderWithInvoice.withSenderWallet(senderWallet)

  const recipientDetailsForBuilder = recipientDetailsFromWallet({
    id: recipientWalletId,
    currency: recipientWalletCurrency,
    username: recipientUsername,
  })
  if (recipientDetailsForBuilder instanceof Error) return recipientDetailsForBuilder

  const builderAfterRecipientStep = builderWithSenderWallet.withRecipientWallet(
    recipientDetailsForBuilder,
  )

  const builderWithConversion = builderAfterRecipientStep.withConversion({
    usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
    btcFromUsd: dealer.getSatsFromCentsForImmediateSell,
  })
  if (builderWithConversion instanceof Error) return builderWithConversion

  const paymentFlow = await builderWithConversion.withoutRoute()
  if (paymentFlow instanceof Error) return paymentFlow

  if (paymentFlow instanceof Error) return paymentFlow

  addAttributesToCurrentSpan({
    "payment.intraLedger.inputAmount": paymentFlow.inputAmount.toString(),
    "payment.intraLedger.senderWalletId": paymentFlow.senderWalletId,
    "payment.intraLedger.senderWalletCurrency": paymentFlow.senderWalletCurrency,
    "payment.intraLedger.recipientWalletId": paymentFlow.recipientWalletId,
    "payment.intraLedger.hash": paymentFlow.intraLedgerHash,
    "payment.intraLedger.description": memo || "",
  })

  return {
    senderWallet,
    paymentFlow,
    recipientAccountId,
    recipientUsername,
  }
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

  const { recipientWalletId, recipientWalletCurrency, recipientUsername } =
    paymentFlow.recipientDetails()
  if (!(recipientWalletId && recipientWalletCurrency)) {
    return new InvalidLightningPaymentFlowBuilderStateError(
      "Expected recipient details missing",
    )
  }
  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet

  return LockService().lockWalletId(
    { walletId: senderWallet.id, logger },
    async (lock) => {
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

      const journal = await LockService().extendLock({ logger, lock }, async () => {
        const lnIntraLedgerMetadata = LedgerFacade.WalletIdIntraledgerLedgerMetadata({
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

        return LedgerFacade.recordIntraledger({
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
      })
      if (journal instanceof Error) return journal

      const totalSendAmounts = paymentFlow.totalAmountsForPayment()

      const notificationsService = NotificationsService(logger)
      if (recipientWalletCurrency === WalletCurrency.Btc) {
        notificationsService.intraLedgerBtcWalletPaid({
          senderWalletId: senderWallet.id,
          recipientWalletId,
          sats: totalSendAmounts.btc.amount,
          displayCurrencyPerSat:
            priceRatio.usdPerSat() as unknown as DisplayCurrencyPerSat,
        })
      } else {
        notificationsService.intraLedgerUsdWalletPaid({
          senderWalletId: senderWallet.id,
          recipientWalletId,
          cents: totalSendAmounts.usd.amount,
          displayCurrencyPerSat:
            priceRatio.usdPerSat() as unknown as DisplayCurrencyPerSat,
        })
      }

      return PaymentSendStatus.Success
    },
  )
}

const addContactsAfterSend = async ({
  senderAccountId,
  senderUsername,
  recipientAccountId,
  recipientUsername,
}: {
  senderAccountId: AccountId
  senderUsername: Username | undefined
  recipientAccountId: AccountId
  recipientUsername: Username | undefined
}): Promise<true | ApplicationError> => {
  if (recipientUsername) {
    const addContactToPayerResult = await Accounts.addNewContact({
      accountId: senderAccountId,
      contactUsername: recipientUsername,
    })
    if (addContactToPayerResult instanceof Error) return addContactToPayerResult
  }

  if (senderUsername) {
    const addContactToPayeeResult = await Accounts.addNewContact({
      accountId: recipientAccountId,
      contactUsername: senderUsername,
    })
    if (addContactToPayeeResult instanceof Error) return addContactToPayeeResult
  }

  return true
}

const recipientDetailsFromWallet = (recipientDetails) => {
  if (recipientDetails === undefined) {
    return new NoRecipientDetailsForIntraLedgerFlowError()
  }

  return {
    id: recipientDetails.id,
    currency: recipientDetails.currency,
    username: recipientDetails.username,
    pubkey: undefined,
    usdPaymentAmount: undefined,
  }
}
