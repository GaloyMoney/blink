import * as caching from "../caching"
import { toLedgerAccountUuid } from "../domain"

import { UnknownLedgerError } from "@/domain/ledger"

export const staticAccountUuids = async () => {
  try {
    return {
      bankOwnerAccountUuid: toLedgerAccountUuid(await caching.getBankOwnerWalletId()),
      dealerBtcAccountUuid: toLedgerAccountUuid(await caching.getDealerBtcWalletId()),
      dealerUsdAccountUuid: toLedgerAccountUuid(await caching.getDealerUsdWalletId()),
    }
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const initialStaticAccountUuids = async () => {
  const result = {} as InitialStaticAccountUuids

  try {
    result["bankOwnerAccountUuid"] = toLedgerAccountUuid(
      await caching.getBankOwnerWalletId(),
    )
  } catch (err) {
    result["bankOwnerAccountUuid"] = err as Error
  }

  try {
    result["dealerBtcAccountUuid"] = toLedgerAccountUuid(
      await caching.getDealerBtcWalletId(),
    )
  } catch (err) {
    result["dealerBtcAccountUuid"] = err as Error
  }

  try {
    result["dealerUsdAccountUuid"] = toLedgerAccountUuid(
      await caching.getDealerUsdWalletId(),
    )
  } catch (err) {
    result["dealerUsdAccountUuid"] = err as Error
  }

  try {
    result["funderAccountUuid"] = toLedgerAccountUuid(await caching.getFunderWalletId())
  } catch (err) {
    result["funderAccountUuid"] = err as Error
  }

  return result
}
