import { InvalidLedgerExternalId } from "../errors"

// Supports alphanumeric characters, dashes and underscores
const ExternalIdRegex = /^[a-z0-9_-]{1,100}$/

export const checkedToLedgerExternalId = (
  externalId: string,
): LedgerExternalId | ValidationError => {
  return externalId.match(ExternalIdRegex)
    ? (externalId as LedgerExternalId)
    : new InvalidLedgerExternalId(externalId)
}
