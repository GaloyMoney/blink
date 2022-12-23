import { ConfigError, getTestAccounts, getTwilioConfig, isRunningJest } from "@config"
import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"
import { baseLogger } from "@services/logger"
import {
  AccountsRepository,
  WalletsRepository,
  UsersRepository,
} from "@services/mongoose"
import { TwilioClient } from "@services/twilio"

const initializeCreatedAccount = async ({
  account,
  config,
  phone,
}: {
  account: Account
  config: AccountsConfig
  phone?: PhoneNumber
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
  const role = getTestAccounts().find(({ phone: phoneTest }) => phoneTest === phone)?.role
  account.role = role || "user"
  account.contactEnabled = account.role === "user" || account.role === "editor"

  const updatedAccount = await AccountsRepository().update(account)
  if (updatedAccount instanceof Error) return updatedAccount

  return updatedAccount
}

export const createAccountWithPhoneIdentifier = async ({
  newAccountInfo: { kratosUserId, phone },
  config,
}: {
  newAccountInfo: NewAccountWithPhoneIdentifier
  config: AccountsConfig
}): Promise<Account | RepositoryError> => {
  let phoneMetadata: PhoneMetadata | PhoneProviderServiceError | undefined

  // we can't mock getCarrier properly because in the end to end test,
  // the server is been launched as a sub process,
  // so it's not been mocked by jest
  if (
    getTwilioConfig().accountSid !== "AC_twilio_id" ||
    isRunningJest /* TwilioClient will be mocked */
  ) {
    phoneMetadata = await TwilioClient().getCarrier(phone)
  }

  if (phoneMetadata instanceof Error) {
    baseLogger.warn({ phone }, "impossible to fetch carrier")
    phoneMetadata = undefined
  }

  const user = await UsersRepository().update({ id: kratosUserId, phone, phoneMetadata })
  if (user instanceof Error) return user

  const accountNew = await AccountsRepository().persistNew(kratosUserId)
  if (accountNew instanceof Error) return accountNew

  const account = await initializeCreatedAccount({
    account: accountNew,
    config,
    phone,
  })
  if (account instanceof Error) return account

  return account
}

// kratos user already exist, as he has been using self registration
export const createAccountForEmailIdentifier = async ({
  kratosUserId,
  config,
}: {
  kratosUserId: UserId
  config: AccountsConfig
}): Promise<Account | RepositoryError> => {
  let account = await AccountsRepository().persistNew(kratosUserId)
  if (account instanceof Error) return account

  account = await initializeCreatedAccount({ account, config })
  if (account instanceof Error) return account

  return account
}
