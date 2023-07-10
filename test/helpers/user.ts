import { addWallet, createAccountWithPhoneIdentifier } from "@app/accounts"
import { addWalletIfNonexistent } from "@app/accounts/add-wallet"
import { getDefaultAccountsConfig, yamlConfig } from "@config"

import {
  CouldNotFindAccountFromKratosIdError,
  CouldNotFindError,
  CouldNotFindUserFromPhoneError,
} from "@domain/errors"
import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"

import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { AccountsIpsRepository } from "@services/mongoose/accounts-ips"
import { Account } from "@services/mongoose/schema"
import { toObjectId } from "@services/mongoose/utils"
import { AuthWithPhonePasswordlessService } from "@services/kratos"

import { baseLogger } from "@services/logger"

import { Accounts, Wallets } from "@app"

import { sleep } from "@utils"

import { AccountLevel, AccountStatus } from "@domain/accounts"

import { lndOutside1, safePay } from "./lightning"

import { randomPhone, randomUserId } from "."

const accounts = AccountsRepository()

const adminUsers = [
  {
    phone: "+16505554327" as PhoneNumber,
    role: "dealer",
    needUsdWallet: true,
  },
  { phone: "+16505554325" as PhoneNumber, role: "funder" },
  { phone: "+16505554334" as PhoneNumber, role: "bankowner" },
]

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

export const getAccountByTestUserRef = async (ref: string): Promise<Account> => {
  const { phone } = getPhoneAndCodeFromRef(ref)
  const user = await UsersRepository().findByPhone(phone)
  if (user instanceof CouldNotFindUserFromPhoneError) {
    const kratosResult = await AuthWithPhonePasswordlessService().loginToken({
      phone,
    })
    if (kratosResult instanceof Error) throw kratosResult
    const { kratosUserId } = kratosResult
    if (!kratosUserId) throw Error("no kratosUserId")

    const recoveredAccount = await Accounts.createAccountWithPhoneIdentifier({
      newAccountInfo: { phone, kratosUserId },
      config: getDefaultAccountsConfig(),
    })
    if (recoveredAccount instanceof Error) throw recoveredAccount
    return recoveredAccount
  }
  if (user instanceof Error) throw user

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

export const getBtcWalletDescriptorByTestUserRef = async (
  ref: string,
): Promise<WalletDescriptor<"BTC">> => {
  const account = await getAccountByTestUserRef(ref)

  const wallets = await WalletsRepository().listByAccountId(account.id)
  if (wallets instanceof Error) throw wallets

  const wallet = wallets.find((w) => w.currency === WalletCurrency.Btc)
  if (wallet === undefined) throw Error("no BTC wallet")

  return { id: wallet.id, currency: WalletCurrency.Btc, accountId: wallet.accountId }
}

export const getUsdWalletDescriptorByTestUserRef = async (
  ref: string,
): Promise<WalletDescriptor<"USD">> => {
  const account = await getAccountByTestUserRef(ref)

  const wallets = await WalletsRepository().listByAccountId(account.id)
  if (wallets instanceof Error) throw wallets

  const wallet = wallets.find((w) => w.currency === WalletCurrency.Usd)
  if (wallet === undefined) throw Error("no USD wallet")

  return { id: wallet.id, currency: WalletCurrency.Usd, accountId: wallet.accountId }
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

export const getAdminPhoneAndCode = async () => {
  const entry = yamlConfig.test_accounts.find((item) => item.role === "editor")
  return { phone: entry?.phone as PhoneNumber, code: entry?.code as PhoneCode }
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

export const createUserAndWalletFromUserRef = async (
  ref: string,
): Promise<WalletDescriptor<"BTC">> => {
  const entry = yamlConfig.test_accounts.find((item) => item.ref === ref)
  if (entry === undefined) throw new Error("no ref matching entry for test")
  return createUserAndWallet(entry)
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

const getRandomPhoneNumber = () => `+1${Math.floor(Math.random() * 10 ** 10)}`

export const createRandomUserAndWallet = async () => {
  const randomEntry: TestEntry = { phone: getRandomPhoneNumber() }
  return createUserAndWallet(randomEntry)
}

export const createRandomUserAndUsdWallet = async (): Promise<
  WalletDescriptor<"USD">
> => {
  const randomEntry: TestEntry = { phone: getRandomPhoneNumber() }
  const { accountId } = await createUserAndWallet(randomEntry)
  const wallet = await addWalletIfNonexistent({
    currency: WalletCurrency.Usd,
    accountId: accountId,
    type: WalletType.Checking,
  })
  if (wallet instanceof Error) throw wallet

  return { id: wallet.id, currency: WalletCurrency.Usd, accountId }
}

export const createUserAndWallet = async (
  entry: TestEntry,
): Promise<WalletDescriptor<"BTC">> => {
  let kratosUserId: UserId

  const phone = entry.phone as PhoneNumber

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
  // Create wallet for account (phone number)
  const wallet = await addWallet({
    currency,
    accountId,
    type: WalletType.Checking,
  })
  if (wallet instanceof Error) throw wallet

  return wallet
}

export const createAndFundNewWallet = async <S extends WalletCurrency>({
  accountId,
  balanceAmount,
}: {
  accountId: AccountId
  balanceAmount: PaymentAmount<S>
}) => {
  // Create new wallet
  const wallet = await addNewWallet({
    accountId,
    currency: balanceAmount.currency,
  })
  if (wallet instanceof Error) throw wallet
  // Fund new wallet if a non-zero balance is passed
  if (balanceAmount.amount === 0n) return wallet
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
      return updateInvoice()
    })(),
  ])
  {
    // first arg is the outsideLndpayResult
    const [, result] = await promises
    expect(result).not.toBeInstanceOf(Error)
  }
  return wallet
}
