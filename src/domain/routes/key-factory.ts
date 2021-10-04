export const CachedRouteLookupKeyFactory = (): CachedRouteLookupKeyFactory => {
  const create = ({
    paymentHash,
    milliSats,
  }: {
    paymentHash: PaymentHash
    milliSats: MilliSatoshis
  }): CachedRouteLookupKey =>
    JSON.stringify({
      id: paymentHash,
      mtokens: milliSats.toString(),
    }) as CachedRouteLookupKey

  return {
    create,
  }
}
