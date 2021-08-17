import { toSats } from "@domain/bitcoin"
import { invoiceExpirationForCurrency } from "@domain/bitcoin/lightning"
import { WalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"
import { LndService } from "@services/lnd"
import { WalletsRepository, WalletInvoicesRepository } from "@services/mongoose"

export const addInvoiceForSelf = async ({
  walletId,
  amount,
  memo = "",
}: AddInvoiceSelfArgs): Promise<LnInvoice | ApplicationError> => {
  const walletInvoiceFactory = WalletInvoiceFactory(walletId)
  return baseAddInvoiceForWallet({
    amount,
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.create,
  })
}

export const addInvoiceNoAmountForSelf = async ({
  walletId,
  memo = "",
}: AddInvoiceNoAmountSelfArgs): Promise<LnInvoice | ApplicationError> => {
  const walletInvoiceFactory = WalletInvoiceFactory(walletId)
  return baseAddInvoiceForWallet({
    amount: toSats(0),
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.create,
  })
}

export const addInvoiceForRecipient = async ({
  username,
  amount,
  memo = "",
}: AddInvoiceRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const walletsRepo = WalletsRepository()
  const walletId = await walletsRepo.walletIdFromUsername(username)
  if (walletId instanceof Error) return walletId

  const walletInvoiceFactory = WalletInvoiceFactory(walletId)

  return baseAddInvoiceForWallet({
    amount,
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
  })
}

export const addInvoiceNoAmountForRecipient = async ({
  username,
  memo = "",
}: AddInvoiceNoAmountRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const walletsRepo = WalletsRepository()
  const walletId = await walletsRepo.walletIdFromUsername(username)
  if (walletId instanceof Error) return walletId

  const walletInvoiceFactory = WalletInvoiceFactory(walletId)

  return baseAddInvoiceForWallet({
    amount: toSats(0),
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
  })
}

const baseAddInvoiceForWallet = async ({
  amount,
  memo,
  walletInvoiceCreateFn,
}: BaseAddInvoiceArgs): Promise<LnInvoice | ApplicationError> => {
  const walletInvoicesRepo = WalletInvoicesRepository()
  const lndService = LndService()

  const registeredInvoice = await lndService.registerInvoice({
    description: memo,
    satoshis: toSats(amount),
    expiresAt: invoiceExpirationForCurrency("BTC", new Date()),
  })
  if (registeredInvoice instanceof Error) return registeredInvoice
  const { invoice } = registeredInvoice

  const walletInvoice = walletInvoiceCreateFn({
    registeredInvoice,
  })
  const persistedWalletInvoice = await walletInvoicesRepo.persist(walletInvoice)
  if (persistedWalletInvoice instanceof Error) return persistedWalletInvoice

  return invoice
}
