export const CachedRouteLookupKeyFactory = (): CachedRouteLookupKeyFactory => {
  const createFromMilliSats = ({
    paymentHash,
    milliSats,
  }: {
    paymentHash: PaymentHash
    milliSats: MilliSatoshis
  }): CachedRouteLookupKey =>
    JSON.stringify({
      id: paymentHash,
      // TODO: we should not use 'mtokens' as a variable name in our domain layer
      mtokens: milliSats.toString(),
    }) as CachedRouteLookupKey

  const createFromCents = ({
    paymentHash,
    cents,
  }: {
    paymentHash: PaymentHash
    cents: UsdCents
  }): CachedRouteLookupKey =>
    JSON.stringify({
      id: paymentHash,
      cents: cents.toString(),
    }) as CachedRouteLookupKey

  return {
    createFromMilliSats,
    createFromCents,
  }
}
