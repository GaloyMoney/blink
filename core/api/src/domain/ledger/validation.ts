export const checkedToLedgerExternalId = (
  externalId: string,
): LedgerExternalId | ValidationError => {
  return externalId as LedgerExternalId
}
