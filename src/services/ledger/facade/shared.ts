import * as caching from "../caching"
import { toLedgerAccountId } from "../domain"

export const staticAccountIds = async () => {
  return {
    bankOwnerAccountId: toLedgerAccountId(await caching.getBankOwnerWalletId()),
    dealerBtcAccountId: toLedgerAccountId(await caching.getDealerBtcWalletId()),
    dealerUsdAccountId: toLedgerAccountId(await caching.getDealerUsdWalletId()),
  }
}
