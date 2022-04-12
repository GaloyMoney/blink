import { getTwoFALimits, getAccountLimits, MS_PER_DAY } from "@config"
import { AccountLimitsChecker, TwoFALimitsChecker } from "@domain/accounts"
import { LightningPaymentFlowBuilder } from "@domain/payments"
import { WalletCurrency } from "@domain/shared"
import { NewDealerPriceService } from "@services/dealer-price"
import {
  AccountsRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@services/mongoose"
import { LndService } from "@services/lnd"
import { LedgerService } from "@services/ledger"
import { AlreadyPaidError } from "@domain/errors"

const dealer = NewDealerPriceService()
const ledger = LedgerService()

const usdFromBtcMidPriceFn = async (
  amount: BtcPaymentAmount,
): Promise<UsdPaymentAmount | DealerPriceServiceError> => {
  const midPriceRatio = await dealer.getCentsPerSatsExchangeMidRate()
  if (midPriceRatio instanceof Error) return midPriceRatio

  return {
    amount: BigInt(Math.ceil(Number(amount.amount) * midPriceRatio)),
    currency: WalletCurrency.Usd,
  }
}

const btcFromUsdMidPriceFn = async (
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
  usdFromBtc,
  btcFromUsd,
}: {
  senderWallet: Wallet
  invoice: LnInvoice
  uncheckedAmount?: number
  usdFromBtc
  btcFromUsd
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
