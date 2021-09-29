export const CachedRouteKeyGenerator = (): CachedRouteKeyGenerator => {
  const generate = ({
    paymentHash,
    milliSats,
  }: {
    paymentHash: PaymentHash
    milliSats: MilliSatoshis
  }): CacheKey =>
    JSON.stringify({
      id: paymentHash,
      mtokens: milliSats.toString(),
    }) as CacheKey

  return {
    generate,
  }
}
