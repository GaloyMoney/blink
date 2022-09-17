import { ConfigError, getTestAccounts } from "@config"
import { WalletCurrency } from "@domain/shared"
import { checkedToKratosUserId, checkedToPhoneNumber } from "@domain/users"
import { WalletType } from "@domain/wallets"
import { baseLogger } from "@services/logger"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { TwilioClient } from "@services/twilio"

const setupAccount = async ({
  userId,
  config,
  phoneNumberValid,
}: {
  userId: UserId
  config: AccountsConfig
  phoneNumberValid?: PhoneNumber
}): Promise<Account | ApplicationError> => {
  const account = await AccountsRepository().findByUserId(userId)
  if (account instanceof Error) return account

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
  account.role = role

  const updatedAccount = await AccountsRepository().update(account)
  if (updatedAccount instanceof Error) return updatedAccount

  return updatedAccount
}

// no kratos user is been added (currently with PhoneSchema)
export const createUserForPhoneSchema = async ({
  newUserInfo: { phone, phoneMetadata },
  config,
}: {
  newUserInfo: NewUserInfo
  config: AccountsConfig
}) => {
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

  const account = await setupAccount({ userId: user.id, config, phoneNumberValid })
  if (account instanceof Error) return account

  return user
}

// kratos user already exist, as he has been using self registration
export const createUserForEmailSchema = async ({
  kratosUserId,
  config,
}: {
  kratosUserId: string
  config: AccountsConfig
}) => {
  const kratosUserIdValid = checkedToKratosUserId(kratosUserId)
  if (kratosUserIdValid instanceof Error) return kratosUserIdValid

  const user = await UsersRepository().persistNewKratosUser({
    kratosUserId: kratosUserIdValid,
  })
  if (user instanceof Error) return user

  const account = await setupAccount({ userId: user.id, config })
  if (account instanceof Error) return account

  return user
}
