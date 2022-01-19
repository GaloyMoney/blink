import { Wallets } from "@app"
import { checkedToUsername } from "@domain/accounts"
import { checkedToSats, toSats } from "@domain/bitcoin"
import { WalletInvoiceFactory } from "@domain/wallet-invoices/wallet-invoice-factory"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"

// TODO: Remove. Used in v1 only
const walletIdFromUsername = async (
  username: Username,
): Promise<WalletId | RepositoryError> => {
  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findByUsername(username)
  if (account instanceof Error) return account

  return account.defaultWalletId
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

  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet

  const limitOk = await Wallets.checkRecipientWalletIdRateLimits(wallet.accountId)
  if (limitOk instanceof Error) return limitOk
  const sats = checkedToSats(amount)
  if (sats instanceof Error) return sats

  const walletInvoiceFactory = WalletInvoiceFactory(walletId)
  return Wallets.registerAndPersistInvoice({
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

  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet

  const limitOk = await Wallets.checkRecipientWalletIdRateLimits(wallet.accountId)
  if (limitOk instanceof Error) return limitOk

  const walletInvoiceFactory = WalletInvoiceFactory(walletId)
  return Wallets.registerAndPersistInvoice({
    sats: toSats(0),
    memo,
    walletInvoiceCreateFn: walletInvoiceFactory.createForRecipient,
  })
}
