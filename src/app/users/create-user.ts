import { checkedToKratosUserId, checkedToPhoneNumber } from "@domain/users"
import { getTestAccounts } from "@config"
import { baseLogger } from "@services/logger"
import {
  WalletsRepository,
  AccountsRepository,
  UsersRepository,
} from "@services/mongoose"
import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"
import { TwilioClient } from "@services/twilio"

const setupAccount = async (userId: UserId): Promise<Account | ApplicationError> => {
  const account = await AccountsRepository().findByUserId(userId)
  if (account instanceof Error) return account

  const wallet = await WalletsRepository().persistNew({
    accountId: account.id,
    type: WalletType.Checking,
    currency: WalletCurrency.Btc,
  })
  if (wallet instanceof Error) return wallet

  account.defaultWalletId = wallet.id

  const updatedAccount = await AccountsRepository().update(account)
  if (updatedAccount instanceof Error) return updatedAccount

  return updatedAccount
}

export const createUser = async ({
  phone,
  phoneMetadata,
}: {
  phone: string
  phoneMetadata?: PhoneMetadata
}) => {
  const phoneNumberValid = checkedToPhoneNumber(phone)
  if (phoneNumberValid instanceof Error) return phoneNumberValid

  const userRaw: NewUserInfo = {
    phone: phoneNumberValid,
    phoneMetadata,
    role: getTestAccounts().find(({ phone }) => phone === phoneNumberValid)?.role,
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

  const account = await setupAccount(user.id)
  if (account instanceof Error) return account

  return user
}

export const createKratosUser = async ({ kratosUserId }: { kratosUserId: string }) => {
  const kratosUserIdValid = checkedToKratosUserId(kratosUserId)
  if (kratosUserIdValid instanceof Error) return kratosUserIdValid

  const user = await UsersRepository().persistNewKratosUser({
    kratosUserId: kratosUserIdValid,
  })
  if (user instanceof Error) return user

  const account = await setupAccount(user.id)
  if (account instanceof Error) return account

  return user
}
