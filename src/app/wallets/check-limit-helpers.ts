import { getTwoFALimits, getAccountLimits, MS_PER_DAY } from "@config"
import { LimitsChecker } from "@domain/accounts"
import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { TwoFA, TwoFANewCodeNeededError } from "@domain/twoFA"
import { WalletCurrency } from "@domain/wallets"
import { LedgerService } from "@services/ledger"

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
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)

  const walletVolume = await ledgerService.intraledgerTxBaseVolumeSince({
    walletId,
    timestamp: timestamp1Day,
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
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)

  const walletVolume = await ledgerService.externalPaymentVolumeSince({
    walletId,
    timestamp: timestamp1Day,
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

export const checkTwoFALimits = async ({
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
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)

  const walletVolume = await ledgerService.allPaymentVolumeSince({
    walletId,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  return limitCheckWithCurrencyConversion({
    amount,
    walletVolume,
    walletCurrency,
    dCConverter,
    limitsCheckerFn: limitsChecker.checkTwoFA,
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
  if (walletCurrency === WalletCurrency.Usd) {
    return limitsCheckerFn({
      amount: toCents(amount),
      walletVolume,
    })
  } else {
    return limitsCheckerFn({
      amount: dCConverter.fromSatsToCents(toSats(amount)),
      walletVolume,
    })
  }
}

export const checkAndVerifyTwoFA = async ({
  amount,
  twoFAToken,
  twoFASecret,
  walletId,
  walletCurrency,
  account,
  dCConverter,
}: {
  amount: Satoshis
  twoFAToken: TwoFAToken | null
  twoFASecret: TwoFASecret
  walletId: WalletId
  walletCurrency: WalletCurrency
  account: Account
  dCConverter: DisplayCurrencyConverter
}): Promise<true | ApplicationError> => {
  const twoFALimitCheck = await checkTwoFALimits({
    amount,
    walletId,
    walletCurrency,
    account,
    dCConverter,
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

const getLimitsChecker = async (
  account: Account,
): Promise<LimitsChecker | ApplicationError> => {
  const accountLimits = getAccountLimits({ level: account.level })
  const twoFALimits = getTwoFALimits()
  return LimitsChecker({
    accountLimits,
    twoFALimits,
  })
}
