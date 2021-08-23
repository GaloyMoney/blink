import { checkedToSats, toSats } from "@domain/bitcoin"
import { invoiceExpirationForCurrency } from "@domain/bitcoin/lightning"
import { WalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"
import { checkedToWalletname } from "@domain/wallets"
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
  recipient,
  amount,
  memo = "",
}: AddInvoiceForRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const walletname = checkedToWalletname(recipient)
  if (walletname instanceof Error) return walletname
  const sats = checkedToSats(amount)
  if (sats instanceof Error) return sats

  const walletId = await walletIdFromWalletname(walletname)
  if (walletId instanceof Error) return walletId

  const walletInvoiceFactory = WalletInvoiceFactory(walletId)
  return registerAndPersistInvoice({
    sats,
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
  })
}

export const addInvoiceNoAmountForRecipient = async ({
  recipient,
  memo = "",
}: AddInvoiceNoAmountForRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const walletname = checkedToWalletname(recipient)
  if (walletname instanceof Error) return walletname

  const walletId = await walletIdFromWalletname(walletname)
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
  const persistedWalletInvoice = await walletInvoicesRepo.persist(walletInvoice)
  if (persistedWalletInvoice instanceof Error) return persistedWalletInvoice

  return invoice
}

const walletIdFromWalletname = async (
  walletname: Walletname,
): Promise<WalletId | RepositoryError> => {
  const walletsRepo = WalletsRepository()
  const wallet = await walletsRepo.findByWalletname(walletname)
  if (wallet instanceof Error) return wallet

  return wallet.id
}
