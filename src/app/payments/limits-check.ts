import { getAccountLimits, ONE_DAY } from "@config"

import { AccountLimitsChecker } from "@domain/accounts"

import * as LedgerFacade from "@services/ledger/facade"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"

export const checkIntraledgerLimits = async ({
  amount,
  accountId,
  priceRatio,
}: {
  amount: UsdPaymentAmount
  accountId: AccountId
  priceRatio: WalletPriceRatio
}) => {
  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountId(accountId)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors

  const walletVolumes = await LedgerFacade.intraledgerTxBaseVolumeAmountForAccountSince({
    accountWalletDescriptors,
    period: ONE_DAY,
  })
  if (walletVolumes instanceof Error) return walletVolumes

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })

  return AccountLimitsChecker({
    accountLimits,
    priceRatio,
  }).checkIntraledger({
    amount,
    walletVolumes,
  })
}

export const checkTradeIntraAccountLimits = async ({
  amount,
  accountId,
  priceRatio,
}: {
  amount: UsdPaymentAmount
  accountId: AccountId
  priceRatio: WalletPriceRatio
}) => {
  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountId(accountId)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors

  const walletVolumes =
    await LedgerFacade.tradeIntraAccountTxBaseVolumeAmountForAccountSince({
      accountWalletDescriptors,
      period: ONE_DAY,
    })
  if (walletVolumes instanceof Error) return walletVolumes

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })

  return AccountLimitsChecker({
    accountLimits,
    priceRatio,
  }).checkTradeIntraAccount({
    amount,
    walletVolumes,
  })
}

export const checkWithdrawalLimits = async ({
  amount,
  accountId,
  priceRatio,
}: {
  amount: UsdPaymentAmount
  accountId: AccountId
  priceRatio: WalletPriceRatio
}) => {
  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountId(accountId)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors

  const walletVolumes = await LedgerFacade.externalPaymentVolumeAmountForAccountSince({
    accountWalletDescriptors,
    period: ONE_DAY,
  })
  if (walletVolumes instanceof Error) return walletVolumes

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })

  return AccountLimitsChecker({
    accountLimits,
    priceRatio,
  }).checkWithdrawal({
    amount,
    walletVolumes,
  })
}
