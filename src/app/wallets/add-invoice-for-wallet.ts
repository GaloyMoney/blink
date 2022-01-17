import { checkedToSats, toSats } from "@domain/bitcoin"
import { invoiceExpirationForCurrency } from "@domain/bitcoin/lightning"
import { RateLimitConfig } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { WalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"
import { checkedToWalletId } from "@domain/wallets"
import { LndService } from "@services/lnd"
import { WalletInvoicesRepository, WalletsRepository } from "@services/mongoose"
import { consumeLimiter } from "@services/rate-limit"

import { getWallet } from "."

export const addInvoiceByWalletId = async ({
  walletId,
  amount,
  memo = "",
}: addInvoiceByWalletIdArgs): Promise<LnInvoice | ApplicationError> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof Error) return wallet

  return addInvoice({
    wallet,
    amount,
    memo,
  })
}

export const addInvoice = async ({
  wallet,
  amount,
  memo = "",
}: AddInvoiceArgs): Promise<LnInvoice | ApplicationError> => {
  const limitOk = await checkSelfWalletIdRateLimits(wallet.accountId)
  if (limitOk instanceof Error) return limitOk
  const sats = checkedToSats(amount)
  if (sats instanceof Error) return sats

  const walletInvoiceFactory = WalletInvoiceFactory(wallet.id)
  return registerAndPersistInvoice({
    sats,
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.create,
  })
}

export const addInvoiceNoAmountByWalletId = async ({
  walletId,
  memo = "",
}: AddInvoiceNoAmountByWalletIdArgs): Promise<LnInvoice | ApplicationError> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof Error) return wallet

  return addInvoiceNoAmount({
    wallet,
    memo,
  })
}

export const addInvoiceNoAmount = async ({
  wallet,
  memo = "",
}: AddInvoiceNoAmountArgs): Promise<LnInvoice | ApplicationError> => {
  const limitOk = await checkSelfWalletIdRateLimits(wallet.accountId)
  if (limitOk instanceof Error) return limitOk

  const walletInvoiceFactory = WalletInvoiceFactory(wallet.id)
  return registerAndPersistInvoice({
    sats: toSats(0),
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.create,
  })
}

export const addInvoiceForRecipient = async ({
  recipientWalletId,
  amount,
  memo = "",
  descriptionHash,
}: AddInvoiceForRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const recipientWalletIdChecked = checkedToWalletId(recipientWalletId)
  if (recipientWalletIdChecked instanceof Error) return recipientWalletIdChecked

  const wallet = await getWallet(recipientWalletIdChecked)
  if (wallet instanceof Error) return wallet

  const limitOk = await checkRecipientWalletIdRateLimits(wallet.accountId)
  if (limitOk instanceof Error) return limitOk

  const sats = checkedToSats(amount)
  if (sats instanceof Error) return sats

  const walletInvoiceFactory = WalletInvoiceFactory(recipientWalletIdChecked)
  return registerAndPersistInvoice({
    sats,
    memo,
    descriptionHash,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
  })
}

export const addInvoiceNoAmountForRecipient = async ({
  recipientWalletId,
  memo = "",
}: AddInvoiceNoAmountForRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const recipientWalletIdChecked = checkedToWalletId(recipientWalletId)
  if (recipientWalletIdChecked instanceof Error) return recipientWalletIdChecked

  const wallet = await getWallet(recipientWalletIdChecked)
  if (wallet instanceof Error) return wallet

  const limitOk = await checkRecipientWalletIdRateLimits(wallet.accountId)
  if (limitOk instanceof Error) return limitOk

  const walletInvoiceFactory = WalletInvoiceFactory(recipientWalletIdChecked)
  return registerAndPersistInvoice({
    sats: toSats(0),
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
  })
}

export const registerAndPersistInvoice = async ({
  sats,
  memo,
  descriptionHash,
  walletInvoiceCreateFn,
}: {
  sats: Satoshis
  memo: string
  descriptionHash?: string
  walletInvoiceCreateFn: WalletInvoiceFactoryCreateMethod
}): Promise<LnInvoice | ApplicationError> => {
  const walletInvoicesRepo = WalletInvoicesRepository()
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const registeredInvoice = await lndService.registerInvoice({
    description: memo,
    descriptionHash,
    satoshis: sats,
    expiresAt: invoiceExpirationForCurrency("BTC", new Date()),
  })
  if (registeredInvoice instanceof Error) return registeredInvoice
  const { invoice } = registeredInvoice

  const walletInvoice = walletInvoiceCreateFn(registeredInvoice)
  const persistedWalletInvoice = await walletInvoicesRepo.persistNew(walletInvoice)
  if (persistedWalletInvoice instanceof Error) return persistedWalletInvoice

  return invoice
}

export const checkSelfWalletIdRateLimits = async (
  accountId: AccountId,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.invoiceCreate,
    keyToConsume: accountId,
  })

export const checkRecipientWalletIdRateLimits = async (
  accountId: AccountId,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.invoiceCreateForRecipient,
    keyToConsume: accountId,
  })
