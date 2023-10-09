import * as caching from "../caching"
import { toLedgerAccountId } from "../domain"

import { UnknownLedgerError } from "@/domain/ledger"

export const staticAccountUuids = async () => {
  try {
    return {
      bankOwnerAccountUuid: toLedgerAccountId(await caching.getBankOwnerWalletId()),
      dealerBtcAccountUuid: toLedgerAccountId(await caching.getDealerBtcWalletId()),
      dealerUsdAccountUuid: toLedgerAccountId(await caching.getDealerUsdWalletId()),
    }
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const initialStaticAccountUuids = async () => {
  const result = {} as InitialStaticAccountUuids

  try {
    result["bankOwnerAccountUuid"] = toLedgerAccountId(
      await caching.getBankOwnerWalletId(),
    )
  } catch (err) {
    result["bankOwnerAccountUuid"] = err as Error
  }

  try {
    result["dealerBtcAccountUuid"] = toLedgerAccountId(
      await caching.getDealerBtcWalletId(),
    )
  } catch (err) {
    result["dealerBtcAccountUuid"] = err as Error
  }

  try {
    result["dealerUsdAccountUuid"] = toLedgerAccountId(
      await caching.getDealerUsdWalletId(),
    )
  } catch (err) {
    result["dealerUsdAccountUuid"] = err as Error
  }

  try {
    result["funderAccountUuid"] = toLedgerAccountId(await caching.getFunderWalletId())
  } catch (err) {
    result["funderAccountUuid"] = err as Error
  }

  return result
}
