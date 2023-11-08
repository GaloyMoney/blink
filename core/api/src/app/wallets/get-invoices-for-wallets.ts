import { MAX_PAGINATION_PAGE_SIZE } from "@/config"
import { checkedToPaginatedQueryArgs } from "@/domain/primitives"
import { WalletInvoicesRepository } from "@/services/mongoose"

export const getInvoicesForWallets = async ({
  wallets,
  rawPaginationArgs,
}: {
  wallets: Wallet[]
  rawPaginationArgs: {
    first?: number | null
    last?: number | null
    before?: string | null
    after?: string | null
  }
}): Promise<PaginatedQueryResult<WalletInvoice> | ApplicationError> => {
  const walletIds = wallets.map((wallet) => wallet.id)

  const paginationArgs = checkedToPaginatedQueryArgs({
    paginationArgs: rawPaginationArgs,
    maxPageSize: MAX_PAGINATION_PAGE_SIZE,
  })

  if (paginationArgs instanceof Error) {
    return paginationArgs
  }

  return WalletInvoicesRepository().findInvoicesForWallets({
    walletIds,
    paginationArgs,
  })
}
