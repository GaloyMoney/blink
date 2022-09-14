import { getBalanceForWallet } from "@app/wallets"
import { getTwoFALimits, MS_PER_DAY } from "@config"
import { toSats } from "@domain/bitcoin"
import { sub, toCents } from "@domain/fiat"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_CENTS,
} from "@domain/shared"
import { LedgerService } from "@services/ledger"
import { baseLogger } from "@services/logger"

export const getBalanceHelper = async (
  walletId: WalletId,
): Promise<CurrencyBaseAmount> => {
  const balance = await getBalanceForWallet({
    walletId,
    logger: baseLogger,
  })
  if (balance instanceof Error) throw balance
  return balance
}

// TODO: currently assuming a bitcoin wallet
// make it generic
export const getRemainingTwoFALimit = async ({
  walletId,
  satsToCents,
}: {
  walletId: WalletId
  satsToCents
}): Promise<UsdCents> => {
  const timestamp1DayAgo = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await LedgerService().allPaymentVolumeSince({
    walletId,
    timestamp: timestamp1DayAgo,
  })
  if (walletVolume instanceof Error) throw walletVolume

  const twoFALimit = getTwoFALimits().threshold
  const outgoing = toSats(walletVolume.outgoingBaseAmount)

  const remainingLimit = sub(twoFALimit, satsToCents(outgoing))
  return !(remainingLimit instanceof Error) && remainingLimit > 0
    ? remainingLimit
    : toCents(0)
}

export const newGetRemainingTwoFALimit = async <T extends WalletCurrency>({
  walletDescriptor,
  priceRatio,
}: {
  walletDescriptor: WalletDescriptor<T>
  priceRatio: PriceRatio
}): Promise<UsdPaymentAmount | ApplicationError> => {
  const timestamp1DayAgo = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await LedgerService().allPaymentVolumeAmountSince({
    walletDescriptor,
    timestamp: timestamp1DayAgo,
  })
  if (walletVolume instanceof Error) return walletVolume

  const twoFALimitAmount = paymentAmountFromNumber({
    amount: getTwoFALimits().threshold,
    currency: WalletCurrency.Usd,
  })
  if (twoFALimitAmount instanceof Error) return twoFALimitAmount

  const usdOutgoingAmount: UsdPaymentAmount | ValidationError =
    walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
      ? priceRatio.convertFromBtc(walletVolume.outgoingBaseAmount as BtcPaymentAmount)
      : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)

  const remainingLimitAmount = AmountCalculator().sub(twoFALimitAmount, usdOutgoingAmount)
  if (remainingLimitAmount instanceof Error) return remainingLimitAmount

  return remainingLimitAmount.amount > 0 ? remainingLimitAmount : ZERO_CENTS
}
