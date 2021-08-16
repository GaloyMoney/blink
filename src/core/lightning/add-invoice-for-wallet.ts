import { toSats } from "@domain/bitcoin"
import { invoiceExpirationForCurrency } from "@domain/bitcoin/lightning"
import { MakeWalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"
import { MakeLndService } from "@services/lnd"
import { WalletInvoicesRepository } from "@services/mongoose"

export const addInvoiceForWallet = async ({ walletId, amount, memo }) => {
  const walletInvoiceFactory = MakeWalletInvoiceFactory(walletId)
  return baseAddInvoiceForWallet({
    amount,
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.create,
  })
}

export const addInvoiceForRecipientWallet = async ({ walletId, amount, memo }) => {
  const walletInvoiceFactory = MakeWalletInvoiceFactory(walletId)
  return baseAddInvoiceForWallet({
    amount,
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
  })
}

const baseAddInvoiceForWallet = async ({
  amount,
  memo,
  walletInvoiceCreateFn,
}): Promise<LnInvoice | CoreError> => {
  const walletInvoicesRepo = WalletInvoicesRepository()
  const lndService = MakeLndService()

  const registeredInvoice = await lndService.registerInvoice({
    description: memo,
    satoshis: toSats(amount),
    expiresAt: invoiceExpirationForCurrency("BTC", new Date()),
  })
  if (registeredInvoice instanceof Error) return registeredInvoice
  const { invoice, pubkey } = registeredInvoice

  const walletInvoice = walletInvoiceCreateFn({
    registeredInvoice,
    pubkey,
  })
  const persistedWalletInvoice = await walletInvoicesRepo.persist(walletInvoice)
  if (persistedWalletInvoice instanceof Error) return persistedWalletInvoice

  return invoice
}
