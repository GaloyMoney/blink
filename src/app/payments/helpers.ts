import { getTwoFALimits, getAccountLimits, MS_PER_DAY } from "@config"
import { AccountLimitsChecker, TwoFALimitsChecker } from "@domain/accounts"
import { LightningPaymentFlowBuilder } from "@domain/payments"
import { WalletCurrency } from "@domain/shared"
import { NewDealerPriceService } from "@services/dealer-price"
import { AccountsRepository, WalletInvoicesRepository } from "@services/mongoose"
import { LndService } from "@services/lnd"
import { LedgerService } from "@services/ledger"

const dealer = NewDealerPriceService()
const ledger = LedgerService()

export const usdFromBtcMidPriceFn = async (
  amount: BtcPaymentAmount,
): Promise<UsdPaymentAmount | DealerPriceServiceError> => {
  const midPriceRatio = await dealer.getCentsPerSatsExchangeMidRate()
  if (midPriceRatio instanceof Error) return midPriceRatio

  return {
    amount: BigInt(Math.ceil(Number(amount.amount) * midPriceRatio)),
    currency: WalletCurrency.Usd,
  }
}

export const btcFromUsdMidPriceFn = async (
  amount: UsdPaymentAmount,
): Promise<BtcPaymentAmount | DealerPriceServiceError> => {
  const midPriceRatio = await dealer.getCentsPerSatsExchangeMidRate()
  if (midPriceRatio instanceof Error) return midPriceRatio

  return {
    amount: BigInt(Math.ceil(Number(amount.amount) / midPriceRatio)),
    currency: WalletCurrency.Btc,
  }
}

export const constructPaymentFlowBuilder = async ({
  senderWallet,
  invoice,
  uncheckedAmount,
}: {
  senderWallet: Wallet
  invoice: LnInvoice
  uncheckedAmount?: number
}): Promise<LPFBWithConversion<WalletCurrency, WalletCurrency> | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const paymentBuilder = LightningPaymentFlowBuilder({
    localNodeIds: lndService.listAllPubkeys(),
    usdFromBtcMidPriceFn,
    btcFromUsdMidPriceFn,
  })
  let builderWithInvoice
  if (uncheckedAmount) {
    builderWithInvoice = paymentBuilder.withNoAmountInvoice({ invoice, uncheckedAmount })
  } else {
    builderWithInvoice = paymentBuilder.withInvoice(invoice)
  }
  const builderWithSenderWallet = builderWithInvoice.withSenderWallet(senderWallet)
  if (builderWithSenderWallet.isIntraLedger()) {
    const invoicesRepo = WalletInvoicesRepository()
    const walletInvoice = await invoicesRepo.findByPaymentHash(invoice.paymentHash)
    if (walletInvoice instanceof Error) return walletInvoice

    const {
      walletId: recipientWalletId,
      currency: recipientsWalletCurrency,
      cents,
    } = walletInvoice
    const usdPaymentAmount =
      cents !== undefined
        ? { amount: BigInt(cents), currency: WalletCurrency.Usd }
        : undefined

    return builderWithSenderWallet
      .withRecipientWallet({
        id: recipientWalletId,
        currency: recipientsWalletCurrency,
        usdPaymentAmount,
      })
      .withConversion({
        usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
        btcFromUsd: dealer.getSatsFromCentsForImmediateSell,
      })
  } else {
    return builderWithSenderWallet.withoutRecipientWallet().withConversion({
      usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
      btcFromUsd: dealer.getSatsFromCentsForImmediateSell,
    })
  }
}

export const newCheckIntraledgerLimits = async ({
  amount,
  wallet,
}: {
  amount: UsdPaymentAmount
  wallet: Wallet
}) => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await ledger.intraledgerTxBaseVolumeSince({
    walletId: wallet.id,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account

  const accountLimits = getAccountLimits({ level: account.level })
  const { checkIntraledger } = AccountLimitsChecker({
    accountLimits,
    usdFromBtcMidPriceFn,
  })

  return checkIntraledger({
    amount,
    walletVolume,
    walletCurrency: wallet.currency,
  })
}

export const newCheckWithdrawalLimits = async ({
  amount,
  wallet,
}: {
  amount: UsdPaymentAmount
  wallet: Wallet
}) => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await ledger.externalPaymentVolumeSince({
    walletId: wallet.id,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  const { checkWithdrawal } = AccountLimitsChecker({
    accountLimits,
    usdFromBtcMidPriceFn,
  })

  return checkWithdrawal({
    amount,
    walletVolume,
    walletCurrency: wallet.currency,
  })
}

export const newCheckTwoFALimits = async ({
  amount,
  wallet,
}: {
  amount: UsdPaymentAmount
  wallet: Wallet
}) => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await ledger.allPaymentVolumeSince({
    walletId: wallet.id,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume
  const twoFALimits = getTwoFALimits()
  const { checkTwoFA } = TwoFALimitsChecker({ twoFALimits, usdFromBtcMidPriceFn })

  return checkTwoFA({
    amount,
    walletVolume,
    walletCurrency: wallet.currency,
  })
}
