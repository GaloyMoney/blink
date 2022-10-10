import { ConfigError, getTestAccounts } from "@config"
import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"
import { baseLogger } from "@services/logger"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { TwilioClient } from "@services/twilio"

const initializeCreatedAccount = async ({
  account,
  config,
  phoneNumberValid,
}: {
  account: Account
  config: AccountsConfig
  phoneNumberValid?: PhoneNumber
}): Promise<Account | ApplicationError> => {
  const newWallet = (currency: WalletCurrency) =>
    WalletsRepository().persistNew({
      accountId: account.id,
      type: WalletType.Checking,
      currency,
    })

  const walletsEnabledConfig = config.initialWallets

  // Create all wallets
  const enabledWallets: Partial<Record<WalletCurrency, Wallet>> = {}
  for (const currency of walletsEnabledConfig) {
    const wallet = await newWallet(currency)
    if (wallet instanceof Error) return wallet
    enabledWallets[currency] = wallet
  }

  // Set default wallet explicitly as BTC, or implicitly as 1st element in
  // walletsEnabledConfig array.
  const defaultWalletId =
    enabledWallets[WalletCurrency.Btc]?.id || enabledWallets[walletsEnabledConfig[0]]?.id

  if (defaultWalletId === undefined) {
    return new ConfigError("NoWalletsEnabledInConfigError")
  }
  account.defaultWalletId = defaultWalletId

  // FIXME: to remove when Casbin is been introduced
  const role = getTestAccounts().find(({ phone }) => phone === phoneNumberValid)?.role
  account.role = role || "user"
  account.contactEnabled = account.role === "user" || account.role === "editor"

  const updatedAccount = await AccountsRepository().update(account)
  if (updatedAccount instanceof Error) return updatedAccount

  return updatedAccount
}

export const createAccountForPhoneSchema = async ({
  newAccountInfo: { phone, phoneMetadata, kratosUserId },
  config,
}: {
  newAccountInfo: NewAccountInfo
  config: AccountsConfig
}): Promise<Account | RepositoryError> => {
  const accountsRepo = AccountsRepository()

  const accountRaw: NewAccountInfo = {
    phone,
    phoneMetadata,
    kratosUserId,
  }

  // FIXME: this is only used from tests. should be refactored with a mock
  if (!phoneMetadata && !!phone) {
    const carrierInfo = await TwilioClient().getCarrier(phone)
    if (carrierInfo instanceof Error) {
      // non fatal error
      baseLogger.warn({ phone }, "impossible to fetch carrier")
    } else {
      accountRaw.phoneMetadata = carrierInfo
    }
  }

  let account = await accountsRepo.persistNew(accountRaw)
  if (account instanceof Error) return account

  account = await initializeCreatedAccount({ account, config, phoneNumberValid: phone })
  if (account instanceof Error) return account

  return account
}

// kratos user already exist, as he has been using self registration
export const createAccountForEmailSchema = async ({
  kratosUserId,
  config,
}: {
  kratosUserId: KratosUserId
  config: AccountsConfig
}): Promise<Account | RepositoryError> => {
  let account = await AccountsRepository().persistNew({ kratosUserId })
  if (account instanceof Error) return account

  account = await initializeCreatedAccount({ account, config })
  if (account instanceof Error) return account

  return account
}
