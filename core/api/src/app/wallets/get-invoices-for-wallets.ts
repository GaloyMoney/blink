import { MAX_PAGINATION_PAGE_SIZE } from "@/config"
import { checkedToLedgerExternalIdSubstring } from "@/domain/ledger"
import { checkedToPaginatedQueryArgs } from "@/domain/primitives"
import { WalletInvoicesRepository } from "@/services/mongoose"

export const getInvoicesForWallets = async ({
  wallets,
  rawPaginationArgs,
}: {
  wallets: Wallet[]
  rawPaginationArgs: RawPaginationArgs
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

export const getInvoicesForWalletsByExternalIdSubstring = async ({
  wallets,
  uncheckedExternalIdSubstring,
  rawPaginationArgs,
}: {
  wallets: Wallet[]
  uncheckedExternalIdSubstring: string
  rawPaginationArgs: RawPaginationArgs
}): Promise<PaginatedQueryResult<WalletInvoice> | ApplicationError> => {
  const externalIdSubstring = checkedToLedgerExternalIdSubstring(
    uncheckedExternalIdSubstring,
  )
  if (externalIdSubstring instanceof Error) return externalIdSubstring

  const walletIds = wallets.map((wallet) => wallet.id)

  const paginationArgs = checkedToPaginatedQueryArgs({
    paginationArgs: rawPaginationArgs,
    maxPageSize: MAX_PAGINATION_PAGE_SIZE,
  })
  if (paginationArgs instanceof Error) {
    return paginationArgs
  }

  return WalletInvoicesRepository().findForWalletsByExternalIdSubstring({
    walletIds,
    externalIdSubstring,
    paginationArgs,
  })
}
