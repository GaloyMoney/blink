import { InvalidLedgerExternalId } from "../errors"

// Supports uuids, base64, or any other alphanumeric strings with underscores
const ExternalIdRegex = /^[A-Za-z0-9+/=_-]{1,100}$/

export const checkedToLedgerExternalId = (
  externalId: string,
): LedgerExternalId | ValidationError => {
  return externalId.match(ExternalIdRegex)
    ? (externalId as LedgerExternalId)
    : new InvalidLedgerExternalId(externalId)
}

export const checkedToLedgerExternalIdSubstring = (
  externalId: string,
): LedgerExternalIdSubstring | ValidationError => {
  const checkedId = checkedToLedgerExternalId(externalId)
  return checkedId instanceof Error
    ? checkedId
    : (checkedId as unknown as LedgerExternalIdSubstring)
}
