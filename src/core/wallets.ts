import { checkRecipientWalletIdLimits, registerAndPersistInvoice } from "@app/wallets"

import { checkedToSats, toSats } from "@domain/bitcoin"
import { checkedToUsername } from "@domain/users"
import { WalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"

import { WalletsRepository } from "@services/mongoose"

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
  const checkedUsername = checkedToUsername(username)
  if (checkedUsername instanceof Error) return checkedUsername
  const walletId = await walletIdFromUsername(checkedUsername)
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

// TODO: Remove. Used in v1 only
export const addInvoiceNoAmountForUsername = async ({
  username,
  memo = "",
}): Promise<LnInvoice | ApplicationError> => {
  const checkedUsername = checkedToUsername(username)
  if (checkedUsername instanceof Error) return checkedUsername
  const walletId = await walletIdFromUsername(checkedUsername)
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
