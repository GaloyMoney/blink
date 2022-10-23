import { createAccountWithPhoneIdentifier } from "@app/accounts"
import { addWalletIfNonexistent } from "@app/accounts/add-wallet"
import { getDefaultAccountsConfig, yamlConfig } from "@config"
import {
  AuthenticationError,
  LikelyNoUserWithThisPhoneExistError,
} from "@domain/authentication/errors"

import { adminUsers } from "@domain/admin-users"
import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { AccountsIpRepository } from "@services/mongoose/accounts-ips"
import { Account } from "@services/mongoose/schema"
import { toObjectId } from "@services/mongoose/utils"

import { CouldNotFindAccountFromKratosIdError } from "@domain/errors"
import { AuthWithPhonePasswordlessService, IdentityRepository } from "@services/kratos"
import { UsersRepository } from "@services/mongoose/users"

const accounts = AccountsRepository()
const identities = IdentityRepository()

export const getPhoneAndCodeFromRef = (ref: string) => {
  const result = yamlConfig.test_accounts.find((item) => item.ref === ref)
  return { phone: result?.phone as PhoneNumber, code: result?.code as PhoneCode }
}

const getUserByTestUserRef = async (ref: string) => {
  const { phone } = getPhoneAndCodeFromRef(ref)
  const user = await identities.slowFindByPhone(phone)
  if (user instanceof Error) throw user
  return user
}

export const getAccountByTestUserRef = async (ref: string) => {
  const user = await getUserByTestUserRef(ref)
  const account = await AccountsRepository().findByKratosUserId(user.id)
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

export const getAccountRecordByTestUserRef = async (ref: string) => {
  const entry = yamlConfig.test_accounts.find((item) => item.ref === ref)
  const user = await identities.slowFindByPhone(entry?.phone as PhoneNumber)
  if (user instanceof Error) throw user
  const accountRecord = await Account.findOne({ kratosUserId: user.id })
  if (!accountRecord) throw Error("missing account")
  return accountRecord
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

export const createUserAndWallet = async (entry: TestEntry) => {
  const phone = entry.phone as PhoneNumber
  let kratosUserId: KratosUserId

  const authService = AuthWithPhonePasswordlessService()

  let kratosResult = await authService.login(phone)

  // currently kratos users are not been reset between tests, but accounts and wallets are.
  if (kratosResult instanceof LikelyNoUserWithThisPhoneExistError) {
    kratosResult = await authService.createIdentityWithSession(phone)
    if (kratosResult instanceof AuthenticationError) throw kratosResult

    kratosUserId = kratosResult.kratosUserId

    let phoneMetadata

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

    const res = await UsersRepository().update({
      id: kratosUserId,
      deviceTokens: [`token-${kratosUserId}`] as DeviceToken[],
      phoneMetadata,
    })
    if (res instanceof Error) throw res
  }
  if (kratosResult instanceof AuthenticationError) throw kratosResult

  kratosUserId = kratosResult.kratosUserId

  let account = await accounts.findByKratosUserId(kratosUserId)

  if (account instanceof CouldNotFindAccountFromKratosIdError) {
    account = await createAccountWithPhoneIdentifier({
      newAccountInfo: { phone, kratosUserId },
      config: getDefaultAccountsConfig(),
    })
    if (account instanceof Error) throw account

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

    const accountIP = await AccountsIpRepository().findById(account.id)
    if (accountIP instanceof Error) throw accountIP

    accountIP.lastIPs.push(ipInfo)
    const result = await AccountsIpRepository().update(accountIP)
    if (result instanceof Error) throw result

    if (entry.needUsdWallet) {
      await addWalletIfNonexistent({
        currency: WalletCurrency.Usd,
        accountId: account.id,
        type: WalletType.Checking,
      })
    }
  }

  if (account instanceof Error) throw account

  if (entry.username) {
    await Account.findOneAndUpdate(
      { _id: toObjectId<AccountId>(account.id) },
      { username: entry.username },
    )
  }

  if (entry.role) {
    const contactEnabled = entry.role === "user" || entry.role === "editor"
    await Account.findOneAndUpdate(
      { _id: toObjectId<AccountId>(account.id) },
      { role: entry.role, contactEnabled },
    )
  }

  if (entry.title) {
    await Account.findOneAndUpdate(
      { _id: toObjectId<AccountId>(account.id) },
      { title: entry.title, coordinates: { latitude: -1, longitude: 1 } },
    )
  }
}
