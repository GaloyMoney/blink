import {
  getTwoFALimits,
  getAccountLimits,
  MS_PER_DAY,
  getDealerConfig,
  MIN_SATS_FOR_PRICE_RATIO_PRECISION,
} from "@config"
import { AccountLimitsChecker, TwoFALimitsChecker } from "@domain/accounts"
import {
  InvalidZeroAmountPriceRatioInputError,
  LightningPaymentFlowBuilder,
  PriceRatio,
  toPriceRatio,
  ZeroAmountForUsdRecipientError,
} from "@domain/payments"
import {
  ErrorLevel,
  ExchangeCurrencyUnit,
  paymentAmountFromNumber,
  WalletCurrency,
} from "@domain/shared"
import { AlreadyPaidError } from "@domain/errors"
import { CENTS_PER_USD } from "@domain/fiat"

import { NewDealerPriceService } from "@services/dealer-price"
import {
  AccountsRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@services/mongoose"
import { LndService } from "@services/lnd"
import { LedgerService } from "@services/ledger"
import {
  addAttributesToCurrentSpan,
  asyncRunInSpan,
  recordExceptionInCurrentSpan,
  SemanticAttributes,
} from "@services/tracing"

import { getCurrentPrice } from "@app/prices"

const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled

const dealer = NewDealerPriceService()
const ledger = LedgerService()

export const usdFromBtcMidPriceFn = async (
  amount: BtcPaymentAmount,
): Promise<UsdPaymentAmount | DealerPriceServiceError> =>
  asyncRunInSpan(
    "app.payments.usdFromBtcMidPriceFn",
    {
      attributes: {
        [SemanticAttributes.CODE_FUNCTION]: "usdFromBtcMidPriceFn",
        [SemanticAttributes.CODE_NAMESPACE]: "app.payments",
      },
    },
    async () => {
      const midPriceRatio = await getMidPriceRatio()
      if (midPriceRatio instanceof Error) return midPriceRatio

      const usdPaymentAmount = midPriceRatio.convertFromBtc(amount)

      addAttributesToCurrentSpan({
        "usdFromBtcMidPriceFn.midPriceRatio": midPriceRatio.usdPerSat(),
        "usdFromBtcMidPriceFn.incoming.amount": Number(amount.amount),
        "usdFromBtcMidPriceFn.incoming.unit":
          amount.currency === WalletCurrency.Btc
            ? ExchangeCurrencyUnit.Btc
            : ExchangeCurrencyUnit.Usd,
        "usdFromBtcMidPriceFn.outgoing.amount": Number(usdPaymentAmount.amount),
        "usdFromBtcMidPriceFn.outgoing.unit":
          usdPaymentAmount.currency === WalletCurrency.Usd
            ? ExchangeCurrencyUnit.Usd
            : ExchangeCurrencyUnit.Btc,
      })

      return usdPaymentAmount
    },
  )

export const btcFromUsdMidPriceFn = async (
  amount: UsdPaymentAmount,
): Promise<BtcPaymentAmount | DealerPriceServiceError> =>
  asyncRunInSpan(
    "app.payments.btcFromUsdMidPriceFn",
    {
      attributes: {
        [SemanticAttributes.CODE_FUNCTION]: "btcFromUsdMidPriceFn",
        [SemanticAttributes.CODE_NAMESPACE]: "app.payments",
      },
    },
    async () => {
      const midPriceRatio = await getMidPriceRatio()
      if (midPriceRatio instanceof Error) return midPriceRatio

      const btcPaymentAmount = midPriceRatio.convertFromUsd(amount)

      addAttributesToCurrentSpan({
        "btcFromUsdMidPriceFn.midPriceRatio": midPriceRatio.usdPerSat(),
        "btcFromUsdMidPriceFn.incoming.amount": Number(amount.amount),
        "btcFromUsdMidPriceFn.incoming.unit":
          amount.currency === WalletCurrency.Usd
            ? ExchangeCurrencyUnit.Usd
            : ExchangeCurrencyUnit.Btc,
        "btcFromUsdMidPriceFn.outgoing.amount": Number(btcPaymentAmount.amount),
        "btcFromUsdMidPriceFn.outgoing.unit":
          btcPaymentAmount.currency === WalletCurrency.Btc
            ? ExchangeCurrencyUnit.Btc
            : ExchangeCurrencyUnit.Usd,
      })

      return btcPaymentAmount
    },
  )

export const getCurrentPriceInCentsPerSat = async (): Promise<
  CentsPerSatsRatio | PriceServiceError
> => {
  const price = await getCurrentPrice()
  if (price instanceof Error) return price

  return (price * CENTS_PER_USD) as CentsPerSatsRatio
}

export const getMidPriceRatio = async (): Promise<PriceRatio | PriceServiceError> => {
  if (usdHedgeEnabled) {
    const priceRatio = await dealer.getCentsPerSatsExchangeMidRate()
    if (priceRatio instanceof Error) {
      recordExceptionInCurrentSpan({
        error: priceRatio,
        level: ErrorLevel.Critical,
      })
      const ratio = await getCurrentPriceInCentsPerSat()
      if (ratio instanceof Error) return ratio

      return toPriceRatio(ratio)
    }
  }

  const ratio = await getCurrentPriceInCentsPerSat()
  if (ratio instanceof Error) return ratio

  return toPriceRatio(ratio)
}

export const constructPaymentFlowBuilder = async ({
  senderWallet,
  invoice,
  uncheckedAmount,
  usdFromBtc,
  btcFromUsd,
}: {
  senderWallet: Wallet
  invoice: LnInvoice
  uncheckedAmount?: number
  usdFromBtc: (amount: BtcPaymentAmount) => Promise<UsdPaymentAmount | ApplicationError>
  btcFromUsd: (amount: UsdPaymentAmount) => Promise<BtcPaymentAmount | ApplicationError>
}): Promise<LPFBWithConversion<WalletCurrency, WalletCurrency> | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const paymentBuilder = LightningPaymentFlowBuilder({
    localNodeIds: lndService.listAllPubkeys(),
    usdFromBtcMidPriceFn,
    btcFromUsdMidPriceFn,
  })
  const builderWithInvoice = uncheckedAmount
    ? paymentBuilder.withNoAmountInvoice({ invoice, uncheckedAmount })
    : paymentBuilder.withInvoice(invoice)

  const builderWithSenderWallet = builderWithInvoice.withSenderWallet(senderWallet)

  let builderAfterRecipientStep:
    | LPFBWithRecipientWallet<WalletCurrency, WalletCurrency>
    | LPFBWithError
  if (builderWithSenderWallet.isIntraLedger()) {
    const recipientDetails = await recipientDetailsFromInvoice(invoice)
    if (recipientDetails instanceof Error) return recipientDetails
    builderAfterRecipientStep =
      builderWithSenderWallet.withRecipientWallet(recipientDetails)
  } else {
    builderAfterRecipientStep = builderWithSenderWallet.withoutRecipientWallet()
  }

  const builderWithConversion = await builderAfterRecipientStep.withConversion({
    usdFromBtc,
    btcFromUsd,
  })

  const check = await builderWithConversion.usdPaymentAmount()
  if (
    check instanceof InvalidZeroAmountPriceRatioInputError &&
    builderWithSenderWallet.isIntraLedger() === true
  ) {
    return new ZeroAmountForUsdRecipientError()
  }

  return builderWithConversion
}

const recipientDetailsFromInvoice = async (invoice: LnInvoice) => {
  const invoicesRepo = WalletInvoicesRepository()
  const walletInvoice = await invoicesRepo.findByPaymentHash(invoice.paymentHash)
  if (walletInvoice instanceof Error) return walletInvoice

  if (walletInvoice.paid) return new AlreadyPaidError(walletInvoice.paymentHash)

  const {
    walletId: recipientWalletId,
    currency: recipientsWalletCurrency,
    pubkey: recipientPubkey,
    cents,
  } = walletInvoice
  const usdPaymentAmount =
    cents !== undefined
      ? paymentAmountFromNumber({ amount: cents, currency: WalletCurrency.Usd })
      : undefined
  if (usdPaymentAmount instanceof Error) return usdPaymentAmount

  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet
  const { accountId } = recipientWallet

  const recipientAccount = await AccountsRepository().findById(accountId)
  if (recipientAccount instanceof Error) return recipientAccount
  const { username: recipientUsername } = recipientAccount

  return {
    id: recipientWalletId,
    currency: recipientsWalletCurrency,
    pubkey: recipientPubkey,
    usdPaymentAmount,
    username: recipientUsername,
  }
}

export const newCheckIntraledgerLimits = async ({
  amount,
  wallet,
  priceRatio,
}: {
  amount: UsdPaymentAmount
  wallet: Wallet
  priceRatio: PriceRatio
}) => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await ledger.intraledgerTxBaseVolumeAmountSince({
    walletId: wallet.id,
    walletCurrency: wallet.currency,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account

  const accountLimits = getAccountLimits({ level: account.level })
  const { checkIntraledger } = AccountLimitsChecker({
    accountLimits,
    priceRatio,
  })

  return checkIntraledger({
    amount,
    walletVolume,
  })
}

export const newCheckWithdrawalLimits = async ({
  amount,
  wallet,
  priceRatio,
}: {
  amount: UsdPaymentAmount
  wallet: Wallet
  priceRatio: PriceRatio
}) => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await ledger.externalPaymentVolumeAmountSince({
    walletId: wallet.id,
    walletCurrency: wallet.currency,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  const { checkWithdrawal } = AccountLimitsChecker({
    accountLimits,
    priceRatio,
  })

  return checkWithdrawal({
    amount,
    walletVolume,
  })
}

export const newCheckTwoFALimits = async ({
  amount,
  wallet,
  priceRatio,
}: {
  amount: UsdPaymentAmount
  wallet: Wallet
  priceRatio: PriceRatio
}) => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await ledger.allPaymentVolumeAmountSince({
    walletId: wallet.id,
    walletCurrency: wallet.currency,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume
  const twoFALimits = getTwoFALimits()
  const { checkTwoFA } = TwoFALimitsChecker({ twoFALimits, priceRatio })

  return checkTwoFA({
    amount,
    walletVolume,
  })
}

export const getPriceRatioForLimits = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>(
  paymentFlow: PaymentFlow<S, R>,
) => {
  const amount = MIN_SATS_FOR_PRICE_RATIO_PRECISION

  if (paymentFlow.btcPaymentAmount.amount < amount) {
    const btcPaymentAmountForRatio = {
      amount,
      currency: WalletCurrency.Btc,
    }
    const usdPaymentAmountForRatio = await usdFromBtcMidPriceFn(btcPaymentAmountForRatio)
    if (usdPaymentAmountForRatio instanceof Error) return usdPaymentAmountForRatio

    return PriceRatio({
      usd: usdPaymentAmountForRatio,
      btc: btcPaymentAmountForRatio,
    })
  }

  return PriceRatio({
    usd: paymentFlow.usdPaymentAmount,
    btc: paymentFlow.btcPaymentAmount,
  })
}
