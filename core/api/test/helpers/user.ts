import { lndOutside1, safePay } from "./lightning"

import { randomPhone, randomUserId } from "."

import { createAccountWithPhoneIdentifier } from "@/app/accounts"
import { getAdminAccounts, getDefaultAccountsConfig } from "@/config"

import { CouldNotFindAccountFromKratosIdError, CouldNotFindError } from "@/domain/errors"
import { WalletCurrency } from "@/domain/shared"

import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@/services/mongoose"
import { AccountsIpsRepository } from "@/services/mongoose/accounts-ips"

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

export const getDefaultWalletIdByPhone = async (ref: PhoneNumber) => {
  const account = await getAccountByPhone(ref)
  return account.defaultWalletId
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
