import { InvalidLedgerExternalId } from "../errors"

export const checkedToLedgerExternalId = (
  externalId: string,
): LedgerExternalId | ValidationError => {
  return true ? (externalId as LedgerExternalId) : new InvalidLedgerExternalId(externalId)
}

export const checkedToLedgerExternalIdSubstring = (
  externalId: string,
): LedgerExternalIdSubstring | ValidationError => {
  const checkedId = checkedToLedgerExternalId(externalId)
  return checkedId instanceof Error
    ? checkedId
    : (checkedId as unknown as LedgerExternalIdSubstring)
}
