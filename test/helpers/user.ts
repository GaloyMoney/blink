import { getDefaultAccountsConfig, yamlConfig } from "@config"
import { CouldNotFindUserFromPhoneError } from "@domain/errors"
import {
  AuthenticationError,
  LikelyNoUserWithThisPhoneExistError,
} from "@domain/authentication/errors"

import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { User } from "@services/mongoose/schema"
import { toObjectId } from "@services/mongoose/utils"
import { addWallet, addWalletIfNonexistent } from "@app/accounts/add-wallet"
import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"
import { adminUsers } from "@domain/admin-users"
import { UsersIpRepository } from "@services/mongoose/users-ips"
import { createAccountWithPhoneIdentifier } from "@app/accounts"

import { AuthWithPhonePasswordlessService } from "@services/kratos"

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

export const getWalletsByTestUserRef = async (ref: string) => {
  const account = await getAccountByTestUserRef(ref)

  const walletsRepo = WalletsRepository()
  const wallets = await walletsRepo.listByAccountId(account.id)
  if (wallets instanceof Error) throw wallets

  return wallets
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

type TestEntry = {
  role?: string
  needUsdWallet?: boolean
  phone: string
  username?: string | undefined
  phoneMetadataCarrierType?: string | undefined
  title?: string | undefined
  currency?: string | undefined
}

export const createUserAndWalletFromUserRef = async (ref: string) => {
  const entry = yamlConfig.test_accounts.find((item) => item.ref === ref)
  if (entry === undefined) throw new Error("no ref matching entry for test")
  await createUserAndWallet(entry)
}

const createNewAccount = async ({ phone }: { phone: PhoneNumber }) => {
  const authService = AuthWithPhonePasswordlessService()

  let kratosResult = await authService.login(phone)
  if (kratosResult instanceof LikelyNoUserWithThisPhoneExistError) {
    // TODO: remove once kratos states is been re-iniaitlized been tests
    kratosResult = await authService.createIdentityWithSession(phone)
  }
  if (kratosResult instanceof AuthenticationError) throw kratosResult

  const kratosUserId = kratosResult.kratosUserId
  kratosUserId // FIXME variable will be used/line removed in the follow up PR

  const account = await createAccountWithPhoneIdentifier({
    newAccountInfo: { phone, kratosUserId },
    config: getDefaultAccountsConfig(),
  })
  if (account instanceof Error) throw account

  await addIp(account.id)

  return account
}

export const addIp = async (accountId: AccountId) => {
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

  const userIP = await UsersIpRepository().findById(accountId as string as UserId) // FIXME tmp hack until full kratos integration
  if (userIP instanceof Error) throw userIP

  userIP.lastIPs.push(ipInfo)
  const result = await UsersIpRepository().update(userIP)
  if (result instanceof Error) throw result
}

export const createUserAndWallet = async (entry: TestEntry) => {
  const phone = entry.phone as PhoneNumber

  let user = await users.findByPhone(phone)
  if (user instanceof CouldNotFindUserFromPhoneError) {
    let phoneMetadata: PhoneMetadata | undefined = undefined
    if (entry.phoneMetadataCarrierType) {
      phoneMetadata = {
        carrier: {
          type: entry.phoneMetadataCarrierType as CarrierType,
          name: "",
          mobile_network_code: "",
          mobile_country_code: "",
          error_code: "",
        },
        countryCode: "US",
      }
    }

    const authService = AuthWithPhonePasswordlessService()

    let kratosResult = await authService.login(phone)
    if (kratosResult instanceof LikelyNoUserWithThisPhoneExistError) {
      // TODO: remove once kratos states is been re-iniaitlized been tests
      kratosResult = await authService.createIdentityWithSession(phone)
    }
    if (kratosResult instanceof AuthenticationError) throw kratosResult

    const kratosUserId = kratosResult.kratosUserId
    kratosUserId // FIXME variable will be used/line removed in the follow up PR

    const account = await createAccountWithPhoneIdentifier({
      newAccountInfo: { phone, phoneMetadata, kratosUserId },
      config: getDefaultAccountsConfig(),
    })

    if (account instanceof Error) throw account

    await addIp(account.id)

    if (entry.needUsdWallet) {
      await addWalletIfNonexistent({
        currency: WalletCurrency.Usd,
        accountId: account.id,
        type: WalletType.Checking,
      })
    }
  }

  user = await users.findByPhone(phone)
  if (user instanceof Error) throw user
  const uid = user.id

  await User.findOneAndUpdate(
    { _id: toObjectId<UserId>(uid) },
    { deviceToken: ["test-token"] },
  )

  if (entry.username) {
    await User.findOneAndUpdate(
      { _id: toObjectId<UserId>(uid) },
      { username: entry.username },
    )
  }

  if (entry.role) {
    const contactEnabled = entry.role === "user" || entry.role === "editor"
    await User.findOneAndUpdate(
      { _id: toObjectId<UserId>(uid) },
      { role: entry.role, contactEnabled },
    )
  }

  if (entry.title) {
    await User.findOneAndUpdate(
      { _id: toObjectId<UserId>(uid) },
      { title: entry.title, coordinates: { latitude: -1, longitude: 1 } },
    )
  }
}

export const createNewWalletFromPhone = async ({
  phone,
  currency,
}: {
  phone: PhoneNumber
  currency: WalletCurrency
}): Promise<Wallet> => {
  // Fetch user (account) or create if doesn't exist
  let user = await users.findByPhone(phone)
  if (user instanceof CouldNotFindUserFromPhoneError) {
    const account = await createNewAccount({
      phone,
    })
    if (account instanceof Error) throw account

    user = await users.findByPhone(phone)
  }
  if (user instanceof Error) throw user

  // Create wallet for account (phone number)
  const wallet = await addWallet({
    currency,
    accountId: user.defaultAccountId,
    type: WalletType.Checking,
  })
  if (wallet instanceof Error) throw wallet

  // Needed for 'notifications.spec.ts' test to be included in 'sendBalance' function
  await User.findOneAndUpdate(
    { _id: toObjectId<UserId>(user.id) },
    { deviceToken: ["test-token"] },
  )

  return wallet
}
