import { MAX_PAGINATION_PAGE_SIZE } from "@/config"
import { parsePaginationArgs } from "@/domain/pagination"
import { WalletInvoicesRepository } from "@/services/mongoose"

export const getInvoicesForWallets = async ({
  wallets,
  paginationArgs,
}: {
  wallets: Wallet[]
  paginationArgs?: PaginationArgs
}): Promise<PaginatedResult<WalletInvoice> | ApplicationError> => {
  const walletIds = wallets.map((wallet) => wallet.id)

  const parsedPaginationArgs = parsePaginationArgs({
    paginationArgs,
    maxPageSize: MAX_PAGINATION_PAGE_SIZE,
  })

  if (parsedPaginationArgs instanceof Error) {
    return parsedPaginationArgs
  }

  return WalletInvoicesRepository().getInvoicesForWallets({
    walletIds,
    paginationArgs: parsedPaginationArgs,
  })
}
