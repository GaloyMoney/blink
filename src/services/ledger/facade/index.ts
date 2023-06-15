import { paymentAmountFromNumber } from "@domain/shared"

import { MainBook } from "../books"
import { toLedgerAccountId } from "../domain"
import { UnknownLedgerError } from "../domain/errors"

export * from "./get-txns"
export * from "./record-txns"
export * from "./tx-metadata"
export * from "./update-txns"

export const getLedgerAccountBalanceForWalletId = async <T extends WalletCurrency>({
  id: walletId,
  currency,
}: WalletDescriptor<T>): Promise<PaymentAmount<T> | LedgerError> => {
  try {
    const { balance } = await MainBook.balance({
      account: toLedgerAccountId(walletId),
    })
    return paymentAmountFromNumber({ amount: balance, currency })
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
