import { checkedToPhoneNumber } from "@domain/users"
import { baseLogger } from "@services/logger"
import {
  WalletsRepository,
  AccountsRepository,
  UsersRepository,
} from "@services/mongoose"
import { WalletCurrency, WalletType } from "@domain/wallets"
import { TwilioClient } from "@services/twilio"

export const createUser = async ({
  phone,
  phoneMetadata,
}: {
  phone: string
  phoneMetadata: PhoneMetadata | null
}) => {
  const phoneNumberValid = checkedToPhoneNumber(phone)
  if (phoneNumberValid instanceof Error) return phoneNumberValid

  const userRaw: NewUserInfo = { phone: phoneNumberValid, phoneMetadata }

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

  const account = await AccountsRepository().findByUserId(user.id)
  if (account instanceof Error) return account

  const wallet = await WalletsRepository().persistNew({
    accountId: account.id,
    type: WalletType.Checking,
    currency: WalletCurrency.Btc,
  })
  if (wallet instanceof Error) return wallet

  account.defaultWalletId = wallet.id

  const result = await AccountsRepository().update(account)
  if (result instanceof Error) return result

  return user
}
