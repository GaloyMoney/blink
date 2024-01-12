import { lndOutside1, safePay } from "./lightning"

import { randomPhone, randomUserId } from "."

import { createAccountWithPhoneIdentifier } from "@/app/accounts"
import { getAdminAccounts, getDefaultAccountsConfig } from "@/config"

import { CouldNotFindAccountFromKratosIdError, CouldNotFindError } from "@/domain/errors"
import { WalletCurrency } from "@/domain/shared"
import { WalletType } from "@/domain/wallets"

import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@/services/mongoose"
import { AccountsIpsRepository } from "@/services/mongoose/accounts-ips"
import { Account } from "@/services/mongoose/schema"

import { baseLogger } from "@/services/logger"

import { Wallets } from "@/app"

import { sleep } from "@/utils"

const accounts = AccountsRepository()

export const getAccountByPhone = async (phone: PhoneNumber): Promise<Account> => {
  const user = await UsersRepository().findByPhone(phone)
  if (user instanceof Error) throw user
  const account = await AccountsRepository().findByUserId(user.id)
  if (account instanceof Error) throw account
  return account
}

export const getUserIdByPhone = async (phone: PhoneNumber) => {
  const user = await UsersRepository().findByPhone(phone)
  if (user instanceof Error) throw user
  return user.id
}

export const getAccountIdByPhone = async (phone: PhoneNumber) => {
  const account = await getAccountByPhone(phone)
  return account.id
}

export const getDefaultWalletIdByPhone = async (ref: PhoneNumber) => {
  const account = await getAccountByPhone(ref)
  return account.defaultWalletId
}

export const getBtcWalletDescriptorByPhone = async (
  ref: PhoneNumber,
): Promise<WalletDescriptor<"BTC">> => {
  const account = await getAccountByPhone(ref)

  const wallets = await WalletsRepository().listByAccountId(account.id)
  if (wallets instanceof Error) throw wallets

  const wallet = wallets.find((w) => w.currency === WalletCurrency.Btc)
  if (wallet === undefined) throw Error("no BTC wallet")

  return { id: wallet.id, currency: WalletCurrency.Btc, accountId: wallet.accountId }
}

export const getUsdWalletDescriptorByPhone = async (
  ref: PhoneNumber,
): Promise<WalletDescriptor<"USD">> => {
  const account = await getAccountByPhone(ref)

  const wallets = await WalletsRepository().listByAccountId(account.id)
  if (wallets instanceof Error) throw wallets

  const wallet = wallets.find((w) => w.currency === WalletCurrency.Usd)
  if (wallet === undefined) throw Error("no USD wallet")

  return { id: wallet.id, currency: WalletCurrency.Usd, accountId: wallet.accountId }
}

export const getUsdWalletIdByPhone = async (phone: PhoneNumber) => {
  const account = await getAccountByPhone(phone)

  const walletsRepo = WalletsRepository()
  const wallets = await walletsRepo.listByAccountId(account.id)
  if (wallets instanceof Error) throw wallets

  const wallet = wallets.find((w) => w.currency === WalletCurrency.Usd)
  if (wallet === undefined) throw Error("no USD wallet")
  return wallet.id
}

export const getAccountRecordByPhone = async (phone: PhoneNumber) => {
  const user = await UsersRepository().findByPhone(phone)
  if (user instanceof Error) throw user
  const accountRecord = await Account.findOne({ kratosUserId: user.id })
  if (!accountRecord) throw Error("missing account")
  return accountRecord
}

export const createMandatoryUsers = async () => {
  const adminUsers = getAdminAccounts()

  for (const user of adminUsers) {
    await createUserAndWallet(user.phone)
  }
}

export const createUserAndWalletFromPhone = async (
  phone: PhoneNumber,
): Promise<WalletDescriptor<"BTC">> => {
  let kratosUserId: UserId

  const user = await UsersRepository().findByPhone(phone)
  if (user instanceof CouldNotFindError) {
    kratosUserId = randomUserId()

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

    const metadata: IPType = {
      asn: "AS60068",
      provider: "ISP",
      country: "United States",
      isoCode: "US",
      region: "Florida",
      city: "Miami",
      proxy: false,
    }

    const accountIp: AccountIP = {
      accountId: account.id,
      metadata,
      ip: "89.187.173.251" as IpAddress,
    }

    const accountIP = await AccountsIpsRepository().update(accountIp)
    if (!(accountIP instanceof CouldNotFindError) && accountIP instanceof Error)
      throw accountIP
  }

  if (account instanceof Error) throw account

  const wallet = await WalletsRepository().findById(account.defaultWalletId)
  if (wallet instanceof Error) throw wallet
  if (wallet.currency !== WalletCurrency.Btc) {
    throw new Error("Expected BTC-currency default wallet")
  }

  return {
    accountId: account.id,
    id: account.defaultWalletId,
    currency: wallet.currency,
  }
}

export const createRandomUserAndBtcWallet = async () => {
  const phone = randomPhone()
  return createUserAndWallet(phone)
}

export const createRandomUserAndWallets = async (): Promise<{
  usdWalletDescriptor: WalletDescriptor<"USD">
  btcWalletDescriptor: WalletDescriptor<"BTC">
}> => {
  const phone = randomPhone()
  const btcWalletDescriptor = await createUserAndWallet(phone)

  const accountWallets = await WalletsRepository().findAccountWalletsByAccountId(
    btcWalletDescriptor.accountId,
  )
  if (accountWallets instanceof Error) throw accountWallets

  return {
    btcWalletDescriptor,
    usdWalletDescriptor: accountWallets.USD,
  }
}

export const createUserAndWallet = async (
  phone: PhoneNumber,
): Promise<WalletDescriptor<"BTC">> => {
  let kratosUserId: UserId

  const user = await UsersRepository().findByPhone(phone)
  if (user instanceof CouldNotFindError) {
    kratosUserId = randomUserId()

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

    const metadata: IPType = {
      asn: "AS60068",
      provider: "ISP",
      country: "United States",
      isoCode: "US",
      region: "Florida",
      city: "Miami",
      proxy: false,
    }

    const accountIp: AccountIP = {
      accountId: account.id,
      metadata,
      ip: "89.187.173.251" as IpAddress,
    }

    const accountIP = await AccountsIpsRepository().update(accountIp)
    if (!(accountIP instanceof CouldNotFindError) && accountIP instanceof Error)
      throw accountIP
  }

  if (account instanceof Error) throw account

  const wallet = await WalletsRepository().findById(account.defaultWalletId)
  if (wallet instanceof Error) throw wallet
  if (wallet.currency !== WalletCurrency.Btc) {
    throw new Error("Expected BTC-currency default wallet")
  }

  return {
    accountId: account.id,
    id: account.defaultWalletId,
    currency: wallet.currency,
  }
}

export const addNewWallet = async ({
  accountId,
  currency,
}: {
  accountId: AccountId
  currency: WalletCurrency
}): Promise<Wallet> => {
  const wallet = await WalletsRepository().persistNew({
    accountId,
    type: WalletType.Checking,
    currency,
  })
  if (wallet instanceof Error) throw wallet

  return wallet
}

export const fundWallet = async ({
  walletId,
  balanceAmount,
}: {
  walletId: WalletId
  balanceAmount: PaymentAmount<WalletCurrency>
}) => {
  // Fund new wallet if a non-zero balance is passed
  if (balanceAmount.amount === 0n) throw new Error("Invalid zero-amount arg passed")

  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) throw wallet

  const addInvoiceFn =
    wallet.currency === WalletCurrency.Btc
      ? Wallets.addInvoiceForSelfForBtcWallet
      : Wallets.addInvoiceForSelfForUsdWallet
  const invoice = await addInvoiceFn({
    walletId: wallet.id,
    amount: Number(balanceAmount.amount),
    memo: `Fund new wallet ${wallet.id}`,
  })
  if (invoice instanceof Error) throw invoice
  const { paymentRequest, paymentHash } = invoice.lnInvoice
  const updateInvoice = () =>
    Wallets.handleHeldInvoiceByPaymentHash({
      paymentHash,
      logger: baseLogger,
    })
  const promises = Promise.all([
    safePay({ lnd: lndOutside1, request: paymentRequest }),
    (async () => {
      // TODO: we could use event instead of a sleep to lower test latency
      await sleep(500)
      const res = await updateInvoice()
      if (res instanceof Error) throw res
    })(),
  ])
  {
    // first arg is the outsideLndpayResult
    const [, result] = await promises
    expect(result).not.toBeInstanceOf(Error)
  }
  return wallet
}
