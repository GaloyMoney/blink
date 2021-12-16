import {
  getInvoiceCreateAttemptLimits,
  getInvoiceCreateForRecipientAttemptLimits,
} from "@config/app"
import { checkedToSats, toSats } from "@domain/bitcoin"
import { invoiceExpirationForCurrency } from "@domain/bitcoin/lightning"
import { RateLimitPrefix } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { WalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"
import { checkedToWalletPublicId } from "@domain/wallets"
import { LndService } from "@services/lnd"
import { WalletInvoicesRepository, WalletsRepository } from "@services/mongoose"
import { RedisRateLimitService } from "@services/rate-limit"
import { walletIdFromPublicId } from "."

export const addInvoiceByWalletPublicId = async ({
  walletPublicId,
  amount,
  memo = "",
}: AddInvoiceByWalletPublicIdArgs): Promise<LnInvoice | ApplicationError> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findByPublicId(walletPublicId)
  if (wallet instanceof Error) return wallet

  return addInvoice({
    walletId: wallet.id,
    amount,
    memo,
  })
}

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

export const addInvoiceNoAmountByWalletPublicId = async ({
  walletPublicId,
  memo = "",
}: AddInvoiceNoAmountByWalletPublicIdArgs): Promise<LnInvoice | ApplicationError> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findByPublicId(walletPublicId)
  if (wallet instanceof Error) return wallet

  return addInvoiceNoAmount({
    walletId: wallet.id,
    memo,
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
  descriptionHash,
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
    descriptionHash,
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

  const walletInvoice = walletInvoiceCreateFn({
    registeredInvoice,
  })
  const persistedWalletInvoice = await walletInvoicesRepo.persistNew(walletInvoice)
  if (persistedWalletInvoice instanceof Error) return persistedWalletInvoice

  return invoice
}

export const checkSelfWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimiterExceededError> => {
  const invoiceCreateAttemptLimits = getInvoiceCreateAttemptLimits()
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.invoiceCreate,
    limitOptions: invoiceCreateAttemptLimits,
  })
  return limiter.consume(walletId)
}

export const checkRecipientWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimiterExceededError> => {
  const invoiceCreateForRecipientAttempt = getInvoiceCreateForRecipientAttemptLimits()
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.invoiceCreateForRecipient,
    limitOptions: invoiceCreateForRecipientAttempt,
  })
  return limiter.consume(walletId)
}
