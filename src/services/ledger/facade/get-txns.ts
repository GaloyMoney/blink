import { MainBook } from "../books"

import { liabilitiesMainAccount } from "../domain"
import { UnknownLedgerError } from "../domain/errors"

export const getTransactionsByPayoutId = async (
  payoutId: PayoutId,
): Promise<LedgerTransaction<WalletCurrency>[] | LedgerServiceError> => {
  try {
    const { results } = await MainBook.ledger({
      payout_id: payoutId,
      account: liabilitiesMainAccount,
    })
    /* eslint @typescript-eslint/ban-ts-comment: "off" */
    // @ts-ignore-next-line no-implicit-any error
    return results.map((tx) => translateToLedgerTx(tx))
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
