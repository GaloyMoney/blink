import { ConfigError, getTestAccounts } from "@config"
import { checkedToKratosUserId } from "@domain/accounts"
import { WalletCurrency } from "@domain/shared"
import { checkedToPhoneNumber } from "@domain/users"
import { WalletType } from "@domain/wallets"
import { baseLogger } from "@services/logger"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { TwilioClient } from "@services/twilio"

const setupAccount = async ({
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

// no kratos user is been added (currently with PhoneSchema)
export const createAccountForPhoneSchema = async ({
  newUserInfo: { phone, phoneMetadata },
  config,
}: {
  newUserInfo: NewUserInfo
  config: AccountsConfig
}): Promise<Account | RepositoryError> => {
  const phoneNumberValid = checkedToPhoneNumber(phone)
  if (phoneNumberValid instanceof Error) return phoneNumberValid

  const userRaw: NewUserInfo = {
    phone: phoneNumberValid,
    phoneMetadata,
  }

  // FIXME: this is only used from tests. should be refactored with a mock
  if (!phoneMetadata) {
    const carrierInfo = await TwilioClient().getCarrier(phoneNumberValid)
    if (carrierInfo instanceof Error) {
      // non fatal error
      baseLogger.warn({ phoneNumberValid }, "impossible to fetch carrier")
    } else {
      userRaw.phoneMetadata = carrierInfo
    }
  }

  const user = await UsersRepository().persistNew(userRaw)
  if (user instanceof Error) return user

  let account = await AccountsRepository().findByUserId(user.id)
  if (account instanceof Error) return account

  account = await setupAccount({ account, config, phoneNumberValid })
  if (account instanceof Error) return account

  return account
}

// kratos user already exist, as he has been using self registration
export const createAccountForEmailSchema = async ({
  kratosUserId,
  config,
}: {
  kratosUserId: string
  config: AccountsConfig
}): Promise<Account | RepositoryError> => {
  const kratosUserIdValid = checkedToKratosUserId(kratosUserId)
  if (kratosUserIdValid instanceof Error) return kratosUserIdValid

  let account = await AccountsRepository().persistNewKratosUser(kratosUserIdValid)
  if (account instanceof Error) return account

  account = await setupAccount({ account, config })
  if (account instanceof Error) return account

  return account
}
