import { checkedToSats, toSats } from "@domain/bitcoin"
import { invoiceExpirationForCurrency } from "@domain/bitcoin/lightning"
import { WalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"
import { checkedToWalletPublicId } from "@domain/wallets"

import { LndService } from "@services/lnd"
import { WalletInvoicesRepository, WalletsRepository } from "@services/mongoose"

export const addInvoice = async ({
  walletId,
  amount,
  memo = "",
}: AddInvoiceArgs): Promise<LnInvoice | ApplicationError> => {
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
  const sats = checkedToSats(amount)
  if (sats instanceof Error) return sats

  const walletId = await walletIdFromPublicId(walletPublicId)
  if (walletId instanceof Error) return walletId

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

  const walletInvoiceFactory = WalletInvoiceFactory(walletId)
  return registerAndPersistInvoice({
    sats: toSats(0),
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
  })
}

const registerAndPersistInvoice = async ({
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

// TODO: Remove. Used in v1 only
const walletIdFromUsername = async (
  username: Username,
): Promise<WalletId | RepositoryError> => {
  const walletsRepo = WalletsRepository()
  const wallet = await walletsRepo.findByUsername(username)
  if (wallet instanceof Error) return wallet

  return wallet.id
}

// TODO: Remove. Used in v1 only
export const addInvoiceForUsername = async ({
  username,
  amount,
  memo = "",
}): Promise<LnInvoice | ApplicationError> => {
  const walletPublicId = checkedToWalletPublicId(username)
  if (walletPublicId instanceof Error) return walletPublicId
  const sats = checkedToSats(amount)
  if (sats instanceof Error) return sats

  const walletId = await walletIdFromUsername(username)
  if (walletId instanceof Error) return walletId

  const walletInvoiceFactory = WalletInvoiceFactory(walletId)
  return registerAndPersistInvoice({
    sats,
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
  })
}

// TODO: Remove. Used in v1 only
export const addInvoiceNoAmountForUsername = async ({
  username,
  memo = "",
}): Promise<LnInvoice | ApplicationError> => {
  const walletPublicId = checkedToWalletPublicId(username)
  if (walletPublicId instanceof Error) return walletPublicId

  const walletId = await walletIdFromUsername(username)
  if (walletId instanceof Error) return walletId

  const walletInvoiceFactory = WalletInvoiceFactory(walletId)
  return registerAndPersistInvoice({
    sats: toSats(0),
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
  })
}
