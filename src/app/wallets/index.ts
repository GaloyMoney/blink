export * from "./create-on-chain-address"
export * from "./get-balance-for-wallet"
export * from "./get-transactions-for-wallet"
export * from "./get-last-on-chain-address"
export * from "./get-on-chain-fee"
export * from "./get-transaction-by-id"
export * from "./get-transactions-by-hash"
export * from "./update-on-chain-receipt"
export * from "./update-pending-invoices"
export * from "./update-pending-payments"
export * from "./add-invoice-for-wallet"
export * from "./get-lightning-fee"
export * from "./send-lightning"
export * from "./send-on-chain"
export * from "./send-intraledger"

import { WalletsRepository } from "@services/mongoose"

export const getWallet = async (walletId: WalletId) => {
  const wallets = WalletsRepository()
  return wallets.findById(walletId)
}

export const listWalletsByAccountId = async (
  accountId: AccountId,
): Promise<Wallet[] | RepositoryError> => {
  return WalletsRepository().listByAccountId(accountId)
}
