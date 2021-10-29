import {
  getInvoiceCreateAttemptLimits,
  getInvoiceCreateForRecipientAttemptLimits,
} from "@config/app"
import { checkedToSats, toSats } from "@domain/bitcoin"
import { invoiceExpirationForCurrency } from "@domain/bitcoin/lightning"
import { RateLimitPrefix } from "@domain/rate-limit"
import {
  InvoiceCreateRateLimiterExceededError,
  RateLimiterExceededError,
} from "@domain/rate-limit/errors"
import { WalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"
import { checkedToWalletPublicId } from "@domain/wallets"

import { LndService } from "@services/lnd"
import { WalletInvoicesRepository, WalletsRepository } from "@services/mongoose"
import { RedisRateLimitService } from "@services/rate-limit"

export const addInvoice = async ({
  walletId,
  amount,
  memo = "",
}: AddInvoiceArgs): Promise<LnInvoice | ApplicationError> => {
  const limitOk = await checkSelfWalletIdLimits(walletId)
  if (limitOk instanceof Error) return limitOk
  const sats = checkedToSats(amount)
  if (sats instanceof Error) return sats

  const walletInvoiceFactory = WalletInvoiceFactory(walletId)
  return registerAndPersistInvoice({
    sats,
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.create,
  })
}

export const addInvoiceNoAmount = async ({
  walletId,
  memo = "",
}: AddInvoiceNoAmountArgs): Promise<LnInvoice | ApplicationError> => {
  const limitOk = await checkSelfWalletIdLimits(walletId)
  if (limitOk instanceof Error) return limitOk

  const walletInvoiceFactory = WalletInvoiceFactory(walletId)
  return registerAndPersistInvoice({
    sats: toSats(0),
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.create,
  })
}

export const addInvoiceForRecipient = async ({
  recipientWalletPublicId,
  amount,
  memo = "",
}: AddInvoiceForRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const walletPublicId = checkedToWalletPublicId(recipientWalletPublicId)
  if (walletPublicId instanceof Error) return walletPublicId
  const walletId = await walletIdFromPublicId(walletPublicId)
  if (walletId instanceof Error) return walletId

  const limitOk = await checkRecipientWalletIdLimits(walletId)
  if (limitOk instanceof Error) return limitOk
  const sats = checkedToSats(amount)
  if (sats instanceof Error) return sats

  const walletInvoiceFactory = WalletInvoiceFactory(walletId)
  return registerAndPersistInvoice({
    sats,
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
  })
}

export const addInvoiceNoAmountForRecipient = async ({
  recipientWalletPublicId,
  memo = "",
}: AddInvoiceNoAmountForRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const walletPublicId = checkedToWalletPublicId(recipientWalletPublicId)
  if (walletPublicId instanceof Error) return walletPublicId
  const walletId = await walletIdFromPublicId(walletPublicId)
  if (walletId instanceof Error) return walletId

  const limitOk = await checkRecipientWalletIdLimits(walletId)
  if (limitOk instanceof Error) return limitOk

  const walletInvoiceFactory = WalletInvoiceFactory(walletId)
  return registerAndPersistInvoice({
    sats: toSats(0),
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
  })
}

export const registerAndPersistInvoice = async ({
  sats,
  memo,
  walletInvoiceCreateFn,
}: {
  sats: Satoshis
  memo: string
  walletInvoiceCreateFn: WalletInvoiceFactoryCreateMethod
}): Promise<LnInvoice | ApplicationError> => {
  const walletInvoicesRepo = WalletInvoicesRepository()
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const registeredInvoice = await lndService.registerInvoice({
    description: memo,
    satoshis: sats,
    expiresAt: invoiceExpirationForCurrency("BTC", new Date()),
  })
  if (registeredInvoice instanceof Error) return registeredInvoice
  const { invoice } = registeredInvoice

  const walletInvoice = walletInvoiceCreateFn({
    registeredInvoice,
  })
  const persistedWalletInvoice = await walletInvoicesRepo.persistNew(walletInvoice)
  if (persistedWalletInvoice instanceof Error) return persistedWalletInvoice

  return invoice
}

const walletIdFromPublicId = async (
  walletPublicId: WalletPublicId,
): Promise<WalletId | RepositoryError> => {
  const walletsRepo = WalletsRepository()
  const wallet = await walletsRepo.findByPublicId(walletPublicId)
  if (wallet instanceof Error) return wallet

  return wallet.id
}

export const checkSelfWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimiterExceededError> => {
  const invoiceCreateAttemptLimits = getInvoiceCreateAttemptLimits()
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.invoiceCreate,
    limitOptions: invoiceCreateAttemptLimits,
  })
  const limitOk = await limiter.consume(walletId)
  if (limitOk instanceof RateLimiterExceededError)
    return new InvoiceCreateRateLimiterExceededError()
  return limitOk
}

export const checkRecipientWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimiterExceededError> => {
  const invoiceCreateForRecipientAttempt = getInvoiceCreateForRecipientAttemptLimits()
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.invoiceCreateForRecipient,
    limitOptions: invoiceCreateForRecipientAttempt,
  })
  const limitOk = await limiter.consume(walletId)
  if (limitOk instanceof RateLimiterExceededError)
    return new InvoiceCreateRateLimiterExceededError()
  return limitOk
}
