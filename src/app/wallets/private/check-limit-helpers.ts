import { getAccountLimits, ONE_DAY } from "@config"
import { LimitsChecker } from "@domain/accounts"
import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"
import { LedgerService } from "@services/ledger"
import { addAttributesToCurrentSpan } from "@services/tracing"
import { mapObj, timestampDaysAgo } from "@utils"

export const checkIntraledgerLimits = async ({
  amount,
  walletId,
  walletCurrency,
  account,
  dCConverter,
}: {
  amount: CurrencyBaseAmount
  walletId: WalletId
  walletCurrency: WalletCurrency
  account: Account
  dCConverter: DisplayCurrencyConverter
}) => {
  const limitsChecker = await getLimitsChecker(account)
  if (limitsChecker instanceof Error) return limitsChecker

  const ledgerService = LedgerService()
  const timestamp1DayAgo = timestampDaysAgo(ONE_DAY)
  if (timestamp1DayAgo instanceof Error) return timestamp1DayAgo

  const walletVolume = await ledgerService.intraledgerTxBaseVolumeSince({
    walletId,
    timestamp: timestamp1DayAgo,
  })
  if (walletVolume instanceof Error) return walletVolume

  return limitCheckWithCurrencyConversion({
    amount,
    walletVolume,
    walletCurrency,
    dCConverter,
    limitsCheckerFn: limitsChecker.checkIntraledger,
  })
}

export const checkWithdrawalLimits = async ({
  amount,
  walletId,
  walletCurrency,
  account,
  dCConverter,
}: {
  amount: CurrencyBaseAmount
  walletId: WalletId
  walletCurrency: WalletCurrency
  account: Account
  dCConverter: DisplayCurrencyConverter
}) => {
  const limitsChecker = await getLimitsChecker(account)
  if (limitsChecker instanceof Error) return limitsChecker

  const ledgerService = LedgerService()
  const timestamp1DayAgo = timestampDaysAgo(ONE_DAY)
  if (timestamp1DayAgo instanceof Error) return timestamp1DayAgo

  const walletVolume = await ledgerService.externalPaymentVolumeSince({
    walletId,
    timestamp: timestamp1DayAgo,
  })
  if (walletVolume instanceof Error) return walletVolume

  return limitCheckWithCurrencyConversion({
    amount,
    walletVolume,
    walletCurrency,
    dCConverter,
    limitsCheckerFn: limitsChecker.checkWithdrawal,
  })
}

const limitCheckWithCurrencyConversion = ({
  amount,
  walletVolume,
  walletCurrency,
  dCConverter,
  limitsCheckerFn,
}: {
  amount: CurrencyBaseAmount
  walletVolume: TxBaseVolume
  walletCurrency: WalletCurrency
  dCConverter: DisplayCurrencyConverter
  limitsCheckerFn: LimitsCheckerFn
}) => {
  const dCSatstoCents = (amount: CurrencyBaseAmount) =>
    dCConverter.fromSatsToCents(toSats(amount))

  addAttributesToCurrentSpan({ "txVolume.fromWalletCurrency": walletCurrency })
  if (walletCurrency === WalletCurrency.Usd) {
    return limitsCheckerFn({
      amount: toCents(amount),
      walletVolume: mapObj<TxBaseVolume, UsdCents>(walletVolume, toCents),
    })
  } else {
    return limitsCheckerFn({
      amount: dCSatstoCents(amount),
      walletVolume: mapObj<TxBaseVolume, UsdCents>(walletVolume, dCSatstoCents),
    })
  }
}

const getLimitsChecker = async (
  account: Account,
): Promise<LimitsChecker | ApplicationError> => {
  const accountLimits = getAccountLimits({ level: account.level })
  return LimitsChecker({
    accountLimits,
  })
}
