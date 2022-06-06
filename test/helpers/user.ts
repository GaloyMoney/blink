import { createUser } from "@app/users"
import { yamlConfig } from "@config"
import { CouldNotFindUserFromPhoneError } from "@domain/errors"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { User } from "@services/mongoose/schema"
import { toObjectId } from "@services/mongoose/utils"
import { addWallet } from "@app/accounts/add-wallet"
import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"
import { adminUsers } from "@domain/admin-users"
import { UsersIpRepository } from "@services/mongoose/users-ips"

const users = UsersRepository()

const getPhoneByTestUserRef = (ref: string) => {
  const entry = yamlConfig.test_accounts.find((item) => item.ref === ref)
  const phone = entry?.phone as PhoneNumber

  return phone
}

export const getPhoneAndCodeFromRef = (ref: string) => {
  const result = yamlConfig.test_accounts.find((item) => item.ref === ref)
  return { phone: result?.phone as PhoneNumber, code: result?.code as PhoneCode }
}

const getUserByTestUserRef = async (ref: string) => {
  const phone = getPhoneByTestUserRef(ref)
  const user = await UsersRepository().findByPhone(phone)
  if (user instanceof Error) throw user
  return user
}

export const getAccountByTestUserRef = async (ref: string) => {
  const user = await getUserByTestUserRef(ref)
  const account = await AccountsRepository().findByUserId(user.id)
  if (account instanceof Error) throw account
  return account
}

export const getUserIdByTestUserRef = async (ref: string) => {
  const user = await getUserByTestUserRef(ref)
  return user.id
}

export const getAccountIdByTestUserRef = async (ref: string) => {
  const account = await getAccountByTestUserRef(ref)
  return account.id
}

export const getDefaultWalletIdByTestUserRef = async (ref: string) => {
  const account = await getAccountByTestUserRef(ref)
  return account.defaultWalletId
}

export const getUsdWalletIdByTestUserRef = async (ref: string) => {
  const account = await getAccountByTestUserRef(ref)

  const walletsRepo = WalletsRepository()
  const wallets = await walletsRepo.listByAccountId(account.id)
  if (wallets instanceof Error) throw wallets

  const wallet = wallets.find((w) => w.currency === WalletCurrency.Usd)
  if (wallet === undefined) throw Error("no USD wallet")
  return wallet.id
}

export const getDefaultWalletIdByRole = async (role: string) => {
  const entry = adminUsers.find((item) => item.role === role)
  const user = await UsersRepository().findByPhone(entry?.phone as PhoneNumber)
  if (user instanceof Error) throw user
  const account = await AccountsRepository().findByUserId(user.id)
  if (account instanceof Error) throw account
  return account.defaultWalletId
}

export const getUserRecordByTestUserRef = async (ref: string) => {
  const entry = yamlConfig.test_accounts.find((item) => item.ref === ref)
  const phone = entry?.phone as PhoneNumber

  const result = await User.findOne({ phone })
  if (!result) throw Error("user not found")
  return result as UserRecord
}

export const createMandatoryUsers = async () => {
  for (const user of adminUsers) {
    await createUserAndWallet(user)
  }
}

export const createUserAndWalletFromUserRef = async (ref: string) => {
  const entry = yamlConfig.test_accounts.find((item) => item.ref === ref)
  await createUserAndWallet(entry)
}

export const createUserAndWallet = async (entry) => {
  const phone = entry.phone as PhoneNumber

  let userRepo = await users.findByPhone(phone)
  if (userRepo instanceof CouldNotFindUserFromPhoneError) {
    const phoneMetadata = entry.phoneMetadataCarrierType
      ? {
          carrier: {
            type: entry.phoneMetadataCarrierType,
            name: "",
            mobile_network_code: "",
            mobile_country_code: "",
            error_code: "",
          },
          countryCode: "US",
        }
      : undefined
    userRepo = await createUser({ phone, phoneMetadata })
    if (userRepo instanceof Error) throw userRepo

    const lastConnection = new Date()
    const ipInfo: IPType = {
      ip: "89.187.173.251" as IpAddress,
      firstConnection: lastConnection,
      lastConnection: lastConnection,
      asn: "AS60068",
      provider: "ISP",
      country: "United States",
      isoCode: "US",
      region: "Florida",
      city: "Miami",
      proxy: false,
    }

    const userIP = await UsersIpRepository().findById(userRepo.id)
    if (userIP instanceof Error) throw userIP

    userIP.lastIPs.push(ipInfo)
    const result = await UsersIpRepository().update(userIP)
    if (result instanceof Error) throw result

    if (entry.needUsdWallet) {
      await addWallet({
        currency: WalletCurrency.Usd,
        accountId: userRepo.defaultAccountId,
        type: WalletType.Checking,
      })
    }
  }

  if (userRepo instanceof Error) throw userRepo
  const uid = userRepo.id

  if (entry.username) {
    await User.findOneAndUpdate(
      { _id: toObjectId<UserId>(uid) },
      { username: entry.username },
    )
  }

  if (entry.role) {
    await User.findOneAndUpdate({ _id: toObjectId<UserId>(uid) }, { role: entry.role })
  }

  if (entry.title) {
    await User.findOneAndUpdate(
      { _id: toObjectId<UserId>(uid) },
      { title: entry.title, coordinates: { latitude: -1, longitude: 1 } },
    )
  }
}
