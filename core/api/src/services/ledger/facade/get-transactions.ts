import { translateToLedgerTx } from ".."
import { MainBook } from "../books"
import { UnknownLedgerError } from "../domain/errors"

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
