import { UnknownLedgerError } from "@domain/ledger"

import * as caching from "../caching"
import { toLedgerAccountId } from "../domain"

export const staticAccountIds = async () => {
  try {
    return {
      bankOwnerAccountId: toLedgerAccountId(await caching.getBankOwnerWalletId()),
      dealerBtcAccountId: toLedgerAccountId(await caching.getDealerBtcWalletId()),
      dealerUsdAccountId: toLedgerAccountId(await caching.getDealerUsdWalletId()),
    }
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
