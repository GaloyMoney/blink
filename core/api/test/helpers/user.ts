import { lndOutside1, safePay } from "./lightning"

import { randomPhone, randomUserId } from "."

import { addWallet, createAccountWithPhoneIdentifier } from "@/app/accounts"
import { addWalletIfNonexistent } from "@/app/accounts/add-wallet"
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

import { Accounts, Wallets } from "@/app"

import { sleep } from "@/utils"

import { AccountLevel, AccountStatus } from "@/domain/accounts"

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

export const getAccountUuidByPhone = async (phone: PhoneNumber) => {
  const account = await getAccountByPhone(phone)
  return account.uuid
}

export const getDefaultWalletIdByPhone = async (ref: PhoneNumber) => {
  const account = await getAccountByPhone(ref)
  return account.defaultWalletId
}

export const getBtcWalletDescriptorByPhone = async (
  ref: PhoneNumber,
): Promise<WalletDescriptor<"BTC">> => {
  const account = await getAccountByPhone(ref)

  const wallets = await WalletsRepository().listByAccountUuid(account.uuid)
  if (wallets instanceof Error) throw wallets

  const wallet = wallets.find((w) => w.currency === WalletCurrency.Btc)
  if (wallet === undefined) throw Error("no BTC wallet")

  return { id: wallet.id, currency: WalletCurrency.Btc, accountUuid: wallet.accountUuid }
}

export const getUsdWalletDescriptorByPhone = async (
  ref: PhoneNumber,
): Promise<WalletDescriptor<"USD">> => {
  const account = await getAccountByPhone(ref)

  const wallets = await WalletsRepository().listByAccountUuid(account.uuid)
  if (wallets instanceof Error) throw wallets

  const wallet = wallets.find((w) => w.currency === WalletCurrency.Usd)
  if (wallet === undefined) throw Error("no USD wallet")

  return { id: wallet.id, currency: WalletCurrency.Usd, accountUuid: wallet.accountUuid }
}

export const getUsdWalletIdByPhone = async (phone: PhoneNumber) => {
  const account = await getAccountByPhone(phone)

  const walletsRepo = WalletsRepository()
  const wallets = await walletsRepo.listByAccountUuid(account.uuid)
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
      accountUuid: account.uuid,
      metadata,
      ip: "89.187.173.251" as IpAddress,
    }

    const accountIP = await AccountsIpsRepository().update(accountIp)
    if (!(accountIP instanceof CouldNotFindError) && accountIP instanceof Error)
      throw accountIP

    await addWalletIfNonexistent({
      currency: WalletCurrency.Usd,
      accountUuid: account.uuid,
      type: WalletType.Checking,
    })
  }

  if (account instanceof Error) throw account

  const wallet = await WalletsRepository().findById(account.defaultWalletId)
  if (wallet instanceof Error) throw wallet
  if (wallet.currency !== WalletCurrency.Btc) {
    throw new Error("Expected BTC-currency default wallet")
  }

  return {
    accountUuid: account.uuid,
    id: account.defaultWalletId,
    currency: wallet.currency,
  }
}

export const createAccount = async ({
  initialWallets,
  userId,
}: {
  initialWallets: WalletCurrency[]
  userId?: UserId
}) => {
  const phone = randomPhone()

  const kratosUserId = userId || randomUserId()

  const account = await Accounts.createAccountWithPhoneIdentifier({
    newAccountInfo: { phone, kratosUserId },
    config: {
      initialStatus: AccountStatus.Active,
      initialWallets,
      initialLevel: AccountLevel.One,
    },
  })
  if (account instanceof Error) throw account

  return account
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

  const usdWallet = await addWalletIfNonexistent({
    currency: WalletCurrency.Usd,
    accountUuid: btcWalletDescriptor.accountUuid,
    type: WalletType.Checking,
  })
  if (usdWallet instanceof Error) throw usdWallet

  return {
    btcWalletDescriptor,
    usdWalletDescriptor: {
      id: usdWallet.id,
      currency: WalletCurrency.Usd,
      accountUuid: usdWallet.accountUuid,
    },
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
      accountUuid: account.uuid,
      metadata,
      ip: "89.187.173.251" as IpAddress,
    }

    const accountIP = await AccountsIpsRepository().update(accountIp)
    if (!(accountIP instanceof CouldNotFindError) && accountIP instanceof Error)
      throw accountIP

    await addWalletIfNonexistent({
      currency: WalletCurrency.Usd,
      accountUuid: account.uuid,
      type: WalletType.Checking,
    })
  }

  if (account instanceof Error) throw account

  const wallet = await WalletsRepository().findById(account.defaultWalletId)
  if (wallet instanceof Error) throw wallet
  if (wallet.currency !== WalletCurrency.Btc) {
    throw new Error("Expected BTC-currency default wallet")
  }

  return {
    accountUuid: account.uuid,
    id: account.defaultWalletId,
    currency: wallet.currency,
  }
}

export const addNewWallet = async ({
  accountUuid,
  currency,
}: {
  accountUuid: AccountUuid
  currency: WalletCurrency
}): Promise<Wallet> => {
  // Create wallet for account (phone number)
  const wallet = await addWallet({
    currency,
    accountUuid,
    type: WalletType.Checking,
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
  const lnInvoice = await addInvoiceFn({
    walletId: wallet.id,
    amount: Number(balanceAmount.amount),
    memo: `Fund new wallet ${wallet.id}`,
  })
  if (lnInvoice instanceof Error) throw lnInvoice
  const { paymentRequest: invoice, paymentHash } = lnInvoice
  const updateInvoice = () =>
    Wallets.updatePendingInvoiceByPaymentHash({
      paymentHash,
      logger: baseLogger,
    })
  const promises = Promise.all([
    safePay({ lnd: lndOutside1, request: invoice }),
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
