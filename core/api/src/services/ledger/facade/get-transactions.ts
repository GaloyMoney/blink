import { translateToLedgerTx } from ".."
import { MainBook } from "../books"
import { UnknownLedgerError } from "../domain/errors"

import { toLiabilitiesWalletId } from "@/domain/ledger"

export const getTransactionsForWalletByPaymentHash = async ({
  walletId,
  paymentHash,
}: {
  walletId: WalletId
  paymentHash: PaymentHash
}): Promise<LedgerTransaction<WalletCurrency>[] | LedgerError> => {
  const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
  try {
    const { results } = await MainBook.ledger({
      account: liabilitiesWalletId,
      hash: paymentHash,
    })

    return results.map((tx) => translateToLedgerTx(tx))
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
