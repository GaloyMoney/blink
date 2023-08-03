import { BitcoinNetwork, getOnChainWalletConfig } from "@config"

import {
  btcFromUsdMidPriceFn,
  getCurrentPriceAsDisplayPriceRatio,
  usdFromBtcMidPriceFn,
} from "@app/prices"
import {
  getPriceRatioForLimits,
  checkIntraledgerLimits,
  checkTradeIntraAccountLimits,
  checkWithdrawalLimits,
} from "@app/payments/helpers"
import { removeDeviceTokens } from "@app/users/remove-device-tokens"

import { AccountValidator } from "@domain/accounts"
import {
  InvalidLightningPaymentFlowBuilderStateError,
  WalletPriceRatio,
} from "@domain/payments"
import { WalletCurrency } from "@domain/shared"
import { displayAmountFromNumber } from "@domain/fiat"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import { ResourceExpiredLockServiceError } from "@domain/lock"
import { checkedToOnChainAddress } from "@domain/bitcoin/onchain"
import { PaymentInputValidator, SettlementMethod } from "@domain/wallets"
import { CouldNotFindError, InsufficientBalanceError } from "@domain/errors"
import { OnChainPaymentFlowBuilder } from "@domain/payments/onchain-payment-flow-builder"
import { DeviceTokensNotRegisteredNotificationsServiceError } from "@domain/notifications"

import * as LedgerFacade from "@services/ledger/facade"

import { DealerPriceService } from "@services/dealer-price"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/bria"
import { LockService } from "@services/lock"
import { baseLogger } from "@services/logger"
import {
  AccountsRepository,
  WalletsRepository,
  UsersRepository,
} from "@services/mongoose"
import { NotificationsService } from "@services/notifications"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { getMinerFeeAndPaymentFlow } from "./get-on-chain-fee"
import { validateIsBtcWallet, validateIsUsdWallet } from "./validate"

const { dustThreshold } = getOnChainWalletConfig()
const dealer = DealerPriceService()

const payOnChainByWalletId = async <R extends WalletCurrency>({
  senderAccount,
  senderWalletId,
  amount: amountRaw,
  amountCurrency: amountCurrencyRaw,
  address,
  speed,
  memo,
  sendAll,
}: PayOnChainByWalletIdArgs): Promise<PayOnChainByWalletIdResult | ApplicationError> => {
  const latestAccountState = await AccountsRepository().findById(senderAccount.id)
  if (latestAccountState instanceof Error) return latestAccountState
  const accountValidator = AccountValidator(latestAccountState)
  if (accountValidator instanceof Error) return accountValidator

  const ledger = LedgerService()

  const amountToSendRaw = sendAll
    ? await ledger.getWalletBalance(senderWalletId)
    : amountRaw
  if (amountToSendRaw instanceof Error) return amountToSendRaw

  if (sendAll && amountToSendRaw === 0) {
    return new InsufficientBalanceError(`No balance left to send.`)
  }

  const validator = PaymentInputValidator(WalletsRepository().findById)
  const validationResult = await validator.validatePaymentInput({
    amount: amountToSendRaw,
    amountCurrency: amountCurrencyRaw,
    senderAccount,
    senderWalletId,
  })
  if (validationResult instanceof Error) return validationResult

  const { amount, senderWallet } = validationResult

  const onchainLogger = baseLogger.child({
    topic: "payment",
    protocol: "onchain",
    transactionType: "payment",
    address,
    amount: Number(amount.amount), // separating here because BigInts don't always parse well
    currencyForAmount: amount.currency,
    memo,
    sendAll,
  })
  const checkedAddress = checkedToOnChainAddress({
    network: BitcoinNetwork(),
    value: address,
  })
  if (checkedAddress instanceof Error) return checkedAddress

  const recipientWallet = await WalletsRepository().findByAddress(checkedAddress)
  if (
    recipientWallet instanceof Error &&
    !(recipientWallet instanceof CouldNotFindError)
  ) {
    return recipientWallet
  }

  const isExternalAddress = async () => recipientWallet instanceof CouldNotFindError

  const withSenderBuilder = OnChainPaymentFlowBuilder({
    volumeLightningFn: LedgerService().lightningTxBaseVolumeSince,
    volumeOnChainFn: LedgerService().onChainTxBaseVolumeSince,
    isExternalAddress,
    sendAll,
    dustThreshold,
  })
    .withAddress(checkedAddress)
    .withSenderWalletAndAccount({
      wallet: senderWallet,
      account: senderAccount,
    })

  const withConversionArgs = {
    hedgeBuyUsd: {
      usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
      btcFromUsd: dealer.getSatsFromCentsForImmediateBuy,
    },
    hedgeSellUsd: {
      usdFromBtc: dealer.getCentsFromSatsForImmediateSell,
      btcFromUsd: dealer.getSatsFromCentsForImmediateSell,
    },
    mid: { usdFromBtc: usdFromBtcMidPriceFn, btcFromUsd: btcFromUsdMidPriceFn },
  }

  if (await withSenderBuilder.isIntraLedger()) {
    if (recipientWallet instanceof CouldNotFindError) return recipientWallet

    const recipientWalletDescriptor: WalletDescriptor<R> = {
      id: recipientWallet.id,
      currency: recipientWallet.currency as R,
      accountId: recipientWallet.accountId,
    }

    const recipientAccount = await AccountsRepository().findById(
      recipientWallet.accountId,
    )
    if (recipientAccount instanceof Error) return recipientAccount

    const builder = withSenderBuilder
      .withRecipientWallet({
        ...recipientWalletDescriptor,
        userId: recipientAccount.kratosUserId,
        username: recipientAccount.username,
      })
      .withAmount(amount)
      .withConversion(withConversionArgs)

    return executePaymentViaIntraledger({
      builder,
      senderWallet,
      senderUsername: senderAccount.username,
      senderDisplayCurrency: senderAccount.displayCurrency,
      memo,
      sendAll,
    })
  }

  const builder = withSenderBuilder
    .withoutRecipientWallet()
    .withAmount(amount)
    .withConversion(withConversionArgs)

  return executePaymentViaOnChain({
    builder,
    senderDisplayCurrency: senderAccount.displayCurrency,
    speed,
    memo,
    sendAll,
    logger: onchainLogger,
  })
}

export const payOnChainByWalletIdForBtcWallet = async (
  args: PayOnChainByWalletIdWithoutCurrencyArgs,
): Promise<PayOnChainByWalletIdResult | ApplicationError> => {
  const validated = await validateIsBtcWallet(args.senderWalletId)
  return validated instanceof Error
    ? validated
    : payOnChainByWalletId({
        ...args,
        amountCurrency: WalletCurrency.Btc,
        sendAll: false,
      })
}

export const payOnChainByWalletIdForUsdWallet = async (
  args: PayOnChainByWalletIdWithoutCurrencyArgs,
): Promise<PayOnChainByWalletIdResult | ApplicationError> => {
  const validated = await validateIsUsdWallet(args.senderWalletId)
  return validated instanceof Error
    ? validated
    : payOnChainByWalletId({
        ...args,
        amountCurrency: WalletCurrency.Usd,
        sendAll: false,
      })
}

export const payOnChainByWalletIdForUsdWalletAndBtcAmount = async (
  args: PayOnChainByWalletIdWithoutCurrencyArgs,
): Promise<PayOnChainByWalletIdResult | ApplicationError> => {
  const validated = await validateIsUsdWallet(args.senderWalletId)
  return validated instanceof Error
    ? validated
    : payOnChainByWalletId({
        ...args,
        amountCurrency: WalletCurrency.Btc,
        sendAll: false,
      })
}

export const payAllOnChainByWalletId = async (
  args: PayAllOnChainByWalletIdArgs,
): Promise<PayOnChainByWalletIdResult | ApplicationError> =>
  payOnChainByWalletId({ ...args, amount: 0, amountCurrency: undefined, sendAll: true })

const executePaymentViaIntraledger = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  builder,
  senderWallet,
  senderUsername,
  senderDisplayCurrency,
  memo,
  sendAll,
}: {
  builder: OPFBWithConversion<S, R> | OPFBWithError
  senderWallet: WalletDescriptor<S>
  senderUsername: Username | undefined
  senderDisplayCurrency: DisplayCurrency
  memo: string | null
  sendAll: boolean
}): Promise<PayOnChainByWalletIdResult | ApplicationError> => {
  const paymentFlow = await builder.withoutMinerFee()
  if (paymentFlow instanceof Error) return paymentFlow

  addAttributesToCurrentSpan({
    "payment.settlement_method": SettlementMethod.IntraLedger,
  })

  const {
    walletDescriptor: recipientWalletDescriptor,
    recipientUsername,
    recipientUserId,
  } = paymentFlow.recipientDetails()
  if (!(recipientWalletDescriptor && recipientUserId)) {
    return new InvalidLightningPaymentFlowBuilderStateError(
      "Expected recipient details missing",
    )
  }
  const { id: recipientWalletId, currency: recipientWalletCurrency } =
    recipientWalletDescriptor

  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet

  const recipientAccount = await AccountsRepository().findById(recipientWallet.accountId)
  if (recipientAccount instanceof Error) return recipientAccount

  const accountValidator = AccountValidator(recipientAccount)
  if (accountValidator instanceof Error) return accountValidator

  // Limit check
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

  return LockService().lockWalletId(senderWallet.id, async (signal) => {
    // Check user balance
    const balance = await LedgerService().getWalletBalanceAmount(senderWallet)
    if (balance instanceof Error) return balance

    const balanceCheck = paymentFlow.checkBalanceForSend(balance)
    if (balanceCheck instanceof Error) return balanceCheck

    // Check lock still intact
    if (signal.aborted) {
      return new ResourceExpiredLockServiceError(signal.error?.message)
    }

    // Construct metadata
    const address = await builder.addressForFlow()
    if (address instanceof Error) return address
    const payeeAddresses = [address]

    const priceRatio = WalletPriceRatio({
      usd: paymentFlow.usdPaymentAmount,
      btc: paymentFlow.btcPaymentAmount,
    })
    if (priceRatio instanceof Error) return priceRatio

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

    let metadata:
      | AddOnChainIntraledgerSendLedgerMetadata
      | AddOnChainTradeIntraAccountLedgerMetadata
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
      } = LedgerFacade.OnChainTradeIntraAccountLedgerMetadata({
        payeeAddresses,
        sendAll,
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
      } = LedgerFacade.OnChainIntraledgerLedgerMetadata({
        payeeAddresses,
        sendAll,
        paymentAmounts: paymentFlow,

        senderAmountDisplayCurrency: senderAmountDisplayCurrencyAsNumber,
        senderFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
        senderDisplayCurrency: senderDisplayCurrency,

        recipientAmountDisplayCurrency: recipientAmountDisplayCurrencyAsNumber,
        recipientFeeDisplayCurrency: 0 as DisplayCurrencyBaseAmount,
        recipientDisplayCurrency: recipientAccount.displayCurrency,

        memoOfPayer: memo || undefined,
        senderUsername,
        recipientUsername,
      }))
    }

    // Record transaction
    const journal = await LedgerFacade.recordIntraledger({
      description: "",
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

    const recipientUser = await UsersRepository().findById(recipientUserId)
    if (recipientUser instanceof Error) return recipientUser

    let amount = paymentFlow.btcPaymentAmount.amount
    if (recipientWalletCurrency === WalletCurrency.Usd) {
      amount = paymentFlow.usdPaymentAmount.amount
    }

    const recipientDisplayAmount = displayAmountFromNumber({
      amount: recipientAmountDisplayCurrencyAsNumber,
      currency: recipientAccount.displayCurrency,
    })
    if (recipientDisplayAmount instanceof Error) return recipientDisplayAmount

    // Send 'received'-side intraledger notification
    const result = await NotificationsService().intraLedgerTxReceived({
      recipientAccountId: recipientWallet.accountId,
      recipientWalletId: recipientWallet.id,
      paymentAmount: { amount, currency: recipientWalletCurrency },
      displayPaymentAmount: recipientDisplayAmount,
      recipientDeviceTokens: recipientUser.deviceTokens,
      recipientLanguage: recipientUser.language,
    })

    if (result instanceof DeviceTokensNotRegisteredNotificationsServiceError) {
      await removeDeviceTokens({ userId: recipientUser.id, deviceTokens: result.tokens })
    }

    return { status: PaymentSendStatus.Success, payoutId: undefined }
  })
}

const executePaymentViaOnChain = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  builder,
  senderDisplayCurrency,
  speed,
  memo,
  sendAll,
  logger,
}: {
  builder: OPFBWithConversion<S, R> | OPFBWithError
  senderDisplayCurrency: DisplayCurrency
  speed: PayoutSpeed
  memo: string | null
  sendAll: boolean
  logger: Logger
}): Promise<PayOnChainByWalletIdResult | ApplicationError> => {
  const senderWalletDescriptor = await builder.senderWalletDescriptor()
  if (senderWalletDescriptor instanceof Error) return senderWalletDescriptor

  const newOnChainService = OnChainService()

  // Limit check
  const proposedAmounts = await builder.proposedAmounts()
  if (proposedAmounts instanceof Error) return proposedAmounts

  const priceRatioForLimits = await getPriceRatioForLimits(proposedAmounts)
  if (priceRatioForLimits instanceof Error) return priceRatioForLimits

  const limitCheck = await checkWithdrawalLimits({
    amount: proposedAmounts.usd,
    accountId: senderWalletDescriptor.accountId,
    priceRatio: priceRatioForLimits,
  })
  if (limitCheck instanceof Error) return limitCheck

  const address = await builder.addressForFlow()

  return LockService().lockWalletId(senderWalletDescriptor.id, async (signal) => {
    // Get estimated miner fee and create 'paymentFlow'
    const paymentFlow = await getMinerFeeAndPaymentFlow({
      builder,
      speed,
    })
    if (paymentFlow instanceof Error) return paymentFlow

    // Check user balance
    const balance = await LedgerService().getWalletBalanceAmount(senderWalletDescriptor)
    if (balance instanceof Error) return balance

    const balanceCheck = paymentFlow.checkBalanceForSend(balance)
    if (balanceCheck instanceof Error) return balanceCheck

    // Check lock still intact
    if (signal.aborted) {
      return new ResourceExpiredLockServiceError(signal.error?.message)
    }

    const bankFee = paymentFlow.bankFees()
    if (bankFee instanceof Error) return bankFee
    const btcBankFee = bankFee.btc

    const btcTotalFee = paymentFlow.btcProtocolAndBankFee
    if (btcTotalFee instanceof Error) return btcTotalFee

    addAttributesToCurrentSpan({
      "payOnChainByWalletId.btcAmount": `${paymentFlow.btcPaymentAmount.amount}`,
      "payOnChainByWalletId.estimatedFee": `${paymentFlow.btcProtocolAndBankFee.amount}`,
      "payOnChainByWalletId.estimatedMinerFee": `${paymentFlow.btcMinerFee?.amount}`,
      "payOnChainByWalletId.totalFee": `${btcTotalFee.amount}`,
      "payOnChainByWalletId.bankFee": `${btcBankFee.amount}`,
    })

    // Construct metadata
    const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
      currency: senderDisplayCurrency,
    })
    if (displayPriceRatio instanceof Error) return displayPriceRatio
    const amountDisplayCurrencyAsNumber = Number(
      displayPriceRatio.convertFromWallet(paymentFlow.btcPaymentAmount).amountInMinor,
    ) as DisplayCurrencyBaseAmount
    const feeDisplayCurrencyAsNumber = Number(
      displayPriceRatio.convertFromWalletToCeil(paymentFlow.btcProtocolAndBankFee)
        .amountInMinor,
    ) as DisplayCurrencyBaseAmount

    const {
      metadata,
      debitAccountAdditionalMetadata,
      internalAccountsAdditionalMetadata,
    } = LedgerFacade.OnChainSendLedgerMetadata({
      paymentAmounts: paymentFlow,

      amountDisplayCurrency: amountDisplayCurrencyAsNumber,
      feeDisplayCurrency: feeDisplayCurrencyAsNumber,
      displayCurrency: senderDisplayCurrency,

      payeeAddresses: [paymentFlow.address],
      sendAll,
      memoOfPayer: memo || undefined,
    })

    // Record transaction
    const journal = await LedgerFacade.recordSendOnChain({
      description: memo || "",
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
      bankFee,
      senderWalletDescriptor: paymentFlow.senderWalletDescriptor(),
      metadata,
      additionalDebitMetadata: debitAccountAdditionalMetadata,
      additionalInternalMetadata: internalAccountsAdditionalMetadata,
    })
    if (journal instanceof Error) return journal

    // Execute payment onchain
    const payoutId = await newOnChainService.queuePayoutToAddress({
      walletDescriptor: senderWalletDescriptor,
      address: paymentFlow.address,
      amount: paymentFlow.btcPaymentAmount,
      speed,
      journalId: journal.journalId,
    })
    if (payoutId instanceof Error) {
      logger.error(
        {
          err: payoutId,
          externalId: journal.journalId,
          address,
          tokens: Number(paymentFlow.btcPaymentAmount.amount),
          success: false,
        },
        `Could not queue payout with id ${payoutId}`,
      )
      const reverted = await LedgerService().revertOnChainPayment({
        journalId: journal.journalId,
      })
      if (reverted instanceof Error) return reverted
      return payoutId
    }

    return { status: PaymentSendStatus.Success, payoutId }
  })
}
