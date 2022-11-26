import { createAccountWithPhoneIdentifier } from "@app/accounts"
import { addWalletIfNonexistent } from "@app/accounts/add-wallet"
import { getDefaultAccountsConfig, yamlConfig } from "@config"

import { adminUsers } from "@domain/admin-users"
import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"
import {
  AccountsRepository,
  WalletsRepository,
  UsersRepository,
} from "@services/mongoose"
import { AccountsIpRepository } from "@services/mongoose/accounts-ips"
import { Account } from "@services/mongoose/schema"
import { toObjectId } from "@services/mongoose/utils"

import { CouldNotFindAccountFromKratosIdError, CouldNotFindError } from "@domain/errors"

import { randomKratosUserId } from "."

const accounts = AccountsRepository()

export const getPhoneAndCodeFromRef = (ref: string) => {
  const result = yamlConfig.test_accounts.find((item) => item.ref === ref)
  return { phone: result?.phone as PhoneNumber, code: result?.code as PhoneCode }
}

const getUserByTestUserRef = async (ref: string) => {
  const { phone } = getPhoneAndCodeFromRef(ref)
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

export const getAccountRecordByTestUserRef = async (ref: string) => {
  const entry = yamlConfig.test_accounts.find((item) => item.ref === ref)
  const user = await UsersRepository().findByPhone(entry?.phone as PhoneNumber)
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
  let kratosUserId: KratosUserId

  const phone = entry.phone as PhoneNumber

  const user = await UsersRepository().findByPhone(phone)
  if (user instanceof CouldNotFindError) {
    kratosUserId = randomKratosUserId()

    const res = await UsersRepository().update({
      id: kratosUserId,
      deviceTokens: [`token-${kratosUserId}`] as DeviceToken[],
      phone,
    })
    if (res instanceof Error) throw res
  } else {
    if (user instanceof Error) throw user

    kratosUserId = user.id
  }

  let account = await accounts.findByUserId(kratosUserId)

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
