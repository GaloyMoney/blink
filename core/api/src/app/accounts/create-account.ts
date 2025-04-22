import { ConfigError, getAdminAccounts, getDefaultAccountsConfig } from "@/config"

import { createUserByPhone } from "@/app/users"
import { AccountLevel, AccountStatus } from "@/domain/accounts"
import { WalletType } from "@/domain/wallets"
import { displayCurrencyFromCountryCode } from "@/domain/price"
import { CouldNotFindAccountFromKratosIdError } from "@/domain/errors"

import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@/services/mongoose"
import { PriceService } from "@/services/price"
import { TwilioClient } from "@/services/twilio-service"

const initializeCreatedAccount = async ({
  account,
  config,
  phone,
  countryCode,
}: {
  account: Account
  config: AccountsConfig
  phone?: PhoneNumber
  countryCode?: string
}): Promise<Account | ApplicationError> => {
  const walletsEnabledConfig = config.initialWallets

  // Create all wallets
  const enabledWallets: Partial<Record<WalletCurrency, Wallet>> = {}
  for (const currency of walletsEnabledConfig) {
    const wallet = await WalletsRepository().persistNew({
      accountId: account.id,
      type: WalletType.Checking,
      currency,
    })
    if (wallet instanceof Error) return wallet
    enabledWallets[currency] = wallet
  }

  // Set default wallet as 1st element in walletsEnabledConfig array.
  const defaultWalletId = enabledWallets[walletsEnabledConfig[0]]?.id

  if (defaultWalletId === undefined) {
    return new ConfigError("NoWalletsEnabledInConfigError")
  }
  account.defaultWalletId = defaultWalletId

  // TODO: improve bootstrap process
  // the script below is to dynamically attribute the bankowner/dealer/funder account at runtime
  const role = getAdminAccounts().find(({ phone: phone2 }) => phone2 === phone)?.role
  account.role = role || "user"
  // end TODO

  account.contactEnabled = account.role === "user"

  account.statusHistory = [
    { status: config.initialStatus, comment: config.initialComment || "Initial Status" },
  ]
  account.level = config.initialLevel

  if (countryCode) {
    const currencies = await PriceService().listCurrencies()
    if (!(currencies instanceof Error)) {
      const displayCurrency = displayCurrencyFromCountryCode({
        countryCode,
        currencies,
      })
      account.displayCurrency =
        displayCurrency instanceof Error ? account.displayCurrency : displayCurrency
    }
  }

  const updatedAccount = await AccountsRepository().update(account)
  if (updatedAccount instanceof Error) return updatedAccount

  return updatedAccount
}

export const createAccountForDeviceAccount = async ({
  userId,
  deviceId,
}: {
  userId: UserId
  deviceId: DeviceId
}): Promise<Account | RepositoryError> => {
  const user = await UsersRepository().update({ id: userId, deviceId })
  if (user instanceof Error) return user

  const accountNew = await AccountsRepository().persistNew(userId)
  if (accountNew instanceof Error) return accountNew

  const levelZeroAccountsConfig = getDefaultAccountsConfig()
  levelZeroAccountsConfig.initialLevel = AccountLevel.Zero

  return initializeCreatedAccount({
    account: accountNew,
    config: levelZeroAccountsConfig,
  })
}

export const createAccountWithPhoneIdentifier = async ({
  newAccountInfo: { kratosUserId, phone },
  config,
  phoneMetadata,
}: {
  newAccountInfo: NewAccountWithPhoneIdentifier
  config: AccountsConfig
  phoneMetadata?: PhoneMetadata
}): Promise<Account | RepositoryError> => {
  const user = await UsersRepository().update({ id: kratosUserId, phone, phoneMetadata })
  if (user instanceof Error) return user

  const accountNew = await AccountsRepository().persistNew(kratosUserId)
  if (accountNew instanceof Error) return accountNew

  const account = await initializeCreatedAccount({
    account: accountNew,
    config,
    phone,
    countryCode: phoneMetadata?.countryCode,
  })
  if (account instanceof Error) return account

  return account
}

export const createInvitedAccountFromPhone = async ({
  phone,
}: {
  phone: PhoneNumber
}): Promise<Account | ApplicationError> => {
  const validationResult = await TwilioClient().validateDestination(phone)
  if (validationResult instanceof Error) return validationResult

  const user = await createUserByPhone(phone)
  if (user instanceof Error) return user

  const existingAccount = await AccountsRepository().findByUserId(user.id)
  if (existingAccount instanceof CouldNotFindAccountFromKratosIdError) {
    const invitedAccountsConfig = getDefaultAccountsConfig()

    invitedAccountsConfig.initialStatus = AccountStatus.Invited
    invitedAccountsConfig.initialComment = "Invited account"

    const account = await createAccountWithPhoneIdentifier({
      newAccountInfo: {
        phone,
        kratosUserId: user.id,
      },
      config: invitedAccountsConfig,
    })

    return account
  }

  return existingAccount
}
