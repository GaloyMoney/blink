import * as caching from "../caching"
import { toLedgerAccountId } from "../domain"

import { UnknownLedgerError } from "@/domain/ledger"

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

export const initialStaticAccountIds = async () => {
  const result = {} as InitialStaticAccountIds

  try {
    result["bankOwnerAccountId"] = toLedgerAccountId(await caching.getBankOwnerWalletId())
  } catch (err) {
    result["bankOwnerAccountId"] = err as Error
  }

  try {
    result["dealerBtcAccountId"] = toLedgerAccountId(await caching.getDealerBtcWalletId())
  } catch (err) {
    result["dealerBtcAccountId"] = err as Error
  }

  try {
    result["dealerUsdAccountId"] = toLedgerAccountId(await caching.getDealerUsdWalletId())
  } catch (err) {
    result["dealerUsdAccountId"] = err as Error
  }

  try {
    result["funderAccountId"] = toLedgerAccountId(await caching.getFunderWalletId())
  } catch (err) {
    result["funderAccountId"] = err as Error
  }

  return result
}
