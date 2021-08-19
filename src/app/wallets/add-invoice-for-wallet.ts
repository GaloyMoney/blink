import { toSats } from "@domain/bitcoin"
import { invoiceExpirationForCurrency } from "@domain/bitcoin/lightning"
import { WalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"
import { LndService } from "@services/lnd"
import {
  WalletInvoicesRepository,
  UsersRepository,
  AccountsRepository,
} from "@services/mongoose"

export const addInvoiceForSelf = async ({
  walletId,
  amount,
  memo = "",
}: AddInvoiceSelfArgs): Promise<LnInvoice | ApplicationError> => {
  const walletInvoiceFactory = WalletInvoiceFactory(walletId)
  return addInvoiceForWallet({
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
  return addInvoiceForWallet({
    amount: toSats(0),
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.create,
  })
}

export const addInvoiceForRecipient = async ({
  recipient,
  amount,
  memo = "",
}: AddInvoiceRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  const usersRepo = UsersRepository()
  const accountsRepo = AccountsRepository()

  const user = await usersRepo.findByUsername(recipient)
  if (user instanceof Error) return user

  const defaultAccount = await accountsRepo.findById(user.defaultAccountId)
  if (defaultAccount instanceof Error) return defaultAccount

  const walletId = defaultAccount.walletIds[0]

  const walletInvoiceFactory = WalletInvoiceFactory(walletId)

  return addInvoiceForWallet({
    amount,
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
  })
}

export const addInvoiceNoAmountForRecipient = async ({
  recipient,
  memo = "",
}: AddInvoiceNoAmountRecipientArgs): Promise<LnInvoice | ApplicationError> => {
  return addInvoiceForRecipient({
    recipient,
    amount: toSats(0),
    memo,
  })
}

const addInvoiceForWallet = async ({
  amount,
  memo,
  walletInvoiceCreateFn,
}: {
  amount: Satoshis
  memo: string
  walletInvoiceCreateFn: WalletInvoiceFactoryCreateMethod
}): Promise<LnInvoice | ApplicationError> => {
  const walletInvoicesRepo = WalletInvoicesRepository()
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const registeredInvoice = await lndService.registerInvoice({
    description: memo,
    satoshis: amount,
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
