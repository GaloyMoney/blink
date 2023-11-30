import { createChainAddress } from "lightning"

import {
  getBalanceForWallet,
  getPendingIncomingOnChainTransactionsForWallets,
  getTransactionsForWallets,
} from "@/app/wallets"
import { RepositoryError } from "@/domain/errors"
import { WalletsRepository, WalletOnChainAddressesRepository } from "@/services/mongoose"
import { getActiveLnd } from "@/services/lnd/config"

export const getBalanceHelper = async (
  walletId: WalletId,
): Promise<CurrencyBaseAmount> => {
  const balance = await getBalanceForWallet({ walletId })
  if (balance instanceof Error) throw balance
  return balance
}

export const getTransactionsForWalletId = async (
  walletId: WalletId,
): Promise<PaginatedQueryResult<WalletTransaction> | ApplicationError> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof RepositoryError) return wallet
  return getTransactionsForWallets({ wallets: [wallet], rawPaginationArgs: {} })
}

export const getPendingTransactionsForWalletId = async (
  walletId: WalletId,
): Promise<WalletTransaction[] | ApplicationError> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof RepositoryError) return wallet
  return getPendingIncomingOnChainTransactionsForWallets({
    wallets: [wallet],
  })
}

// This is to test detection of funds coming in on legacy addresses
// via LND. Remove once all on chain wallets are migrated to Bria
export const lndCreateOnChainAddress = async (
  walletId: WalletId,
): Promise<OnChainAddress | ApplicationError> => {
  const activeNode = getActiveLnd()
  if (activeNode instanceof Error) return activeNode

  const defaultLnd = activeNode.lnd
  const { address } = await createChainAddress({
    lnd: defaultLnd,
    format: "p2wpkh",
  })

  const onChainAddressesRepo = WalletOnChainAddressesRepository()
  const savedOnChainAddress = await onChainAddressesRepo.persistNew({
    walletId,
    onChainAddress: { address: address as OnChainAddress, pubkey: activeNode.pubkey },
  })
  if (savedOnChainAddress instanceof Error) return savedOnChainAddress

  return savedOnChainAddress.address
}
