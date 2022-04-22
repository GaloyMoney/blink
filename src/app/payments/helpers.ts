import { getTwoFALimits, getAccountLimits, MS_PER_DAY, getDealerConfig } from "@config"
import { AccountLimitsChecker, TwoFALimitsChecker } from "@domain/accounts"
import { LightningPaymentFlowBuilder } from "@domain/payments"
import { ErrorLevel, ExchangeCurrencyUnit, WalletCurrency } from "@domain/shared"
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

const usdFromBtcMidPriceFn = async (
  amount: BtcPaymentAmount,
): Promise<UsdPaymentAmount | DealerPriceServiceError> =>
  asyncRunInSpan(
    "app.payments.usdFromBtcMidPriceFn",
    {
      [SemanticAttributes.CODE_FUNCTION]: "usdFromBtcMidPriceFn",
      [SemanticAttributes.CODE_NAMESPACE]: "app.payments",
    },
    async () => {
      const midPriceRatio = await getMidPriceRatio()
      if (midPriceRatio instanceof Error) return midPriceRatio

      const usdPaymentAmount = {
        amount: BigInt(Math.ceil(Number(amount.amount) * midPriceRatio)),
        currency: WalletCurrency.Usd,
      }

      addAttributesToCurrentSpan({
        "usdFromBtcMidPriceFn.midPriceRatio": midPriceRatio,
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

const btcFromUsdMidPriceFn = async (
  amount: UsdPaymentAmount,
): Promise<BtcPaymentAmount | DealerPriceServiceError> =>
  asyncRunInSpan(
    "app.payments.btcFromUsdMidPriceFn",
    {
      [SemanticAttributes.CODE_FUNCTION]: "btcFromUsdMidPriceFn",
      [SemanticAttributes.CODE_NAMESPACE]: "app.payments",
    },
    async () => {
      const midPriceRatio = await getMidPriceRatio()
      if (midPriceRatio instanceof Error) return midPriceRatio

      const btcPaymentAmount = {
        amount: BigInt(Math.ceil(Number(amount.amount) / midPriceRatio)),
        currency: WalletCurrency.Btc,
      }

      addAttributesToCurrentSpan({
        "btcFromUsdMidPriceFn.midPriceRatio": midPriceRatio,
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

export const getMidPriceRatio = async (): Promise<
  CentsPerSatsRatio | DealerPriceServiceError | PriceServiceError
> => {
  let midPriceRatio = usdHedgeEnabled
    ? await dealer.getCentsPerSatsExchangeMidRate()
    : await getCurrentPriceInCentsPerSat()
  if (midPriceRatio instanceof Error && usdHedgeEnabled) {
    recordExceptionInCurrentSpan({
      error: midPriceRatio,
      level: ErrorLevel.Critical,
    })
    midPriceRatio = await getCurrentPriceInCentsPerSat()
  }

  return midPriceRatio
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
  if (
    !(builderWithSenderWallet.isIntraLedger() instanceof Error) &&
    builderWithSenderWallet.isIntraLedger()
  ) {
    const recipientDetails = await recipientDetailsFromInvoice(invoice)
    if (recipientDetails instanceof Error) return recipientDetails
    builderAfterRecipientStep =
      builderWithSenderWallet.withRecipientWallet(recipientDetails)
  } else {
    builderAfterRecipientStep = builderWithSenderWallet.withoutRecipientWallet()
  }

  return builderAfterRecipientStep.withConversion({
    usdFromBtc,
    btcFromUsd,
  })
}

const recipientDetailsFromInvoice = async (invoice) => {
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
      ? { amount: BigInt(cents), currency: WalletCurrency.Usd }
      : undefined

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
