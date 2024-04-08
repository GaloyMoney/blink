export const checkedToLedgerExternalId = (
  externalId: string,
): LedgerExternalId | ValidationError => {
  return externalId as LedgerExternalId
}

export const checkedToPartialLedgerExternalId = (
  externalId: string,
): PartialLedgerExternalId | ValidationError => {
  return checkedToLedgerExternalId(externalId) as unknown as PartialLedgerExternalId
}
