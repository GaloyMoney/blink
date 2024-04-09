import { MainBook } from "../books"
import { translateToLedgerTx } from "../translate"
import { UnknownLedgerError } from "../domain/errors"
import { paginatedLedger } from "../paginated-ledger"

import { toLiabilitiesWalletId } from "@/domain/ledger"

export const getTransactionsForWalletsByPaymentHash = async ({
  walletIds,
  paymentHash,
}: {
  walletIds: WalletId[]
  paymentHash: PaymentHash
}): Promise<LedgerTransaction<WalletCurrency>[] | LedgerError> => {
  const liabilitiesWalletIds = walletIds.map(toLiabilitiesWalletId)
  try {
    const { results } = await MainBook.ledger({
      account: liabilitiesWalletIds,
      hash: paymentHash,
    })

    return results.map((tx) => translateToLedgerTx(tx))
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const getTransactionsForWalletsByExternalIdPattern = async ({
  walletIds,
  externalIdPattern,
  paginationArgs,
}: {
  walletIds: WalletId[]
  externalIdPattern: PartialLedgerExternalId
  paginationArgs: PaginatedQueryArgs
}): Promise<PaginatedQueryResult<LedgerTransaction<WalletCurrency>> | LedgerError> => {
  const liabilitiesWalletIds = walletIds.map(toLiabilitiesWalletId)
  try {
    const ledgerResp = await paginatedLedger({
      filters: { mediciFilters: { account: liabilitiesWalletIds }, externalIdPattern },
      paginationArgs,
    })

    return ledgerResp
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
