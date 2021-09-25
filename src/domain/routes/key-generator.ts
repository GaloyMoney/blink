export const CachedRouteKeyGenerator = (
  paymentHash: PaymentHash,
): CachedRouteKeyGenerator => {
  const generate = (milliSats: MilliSatoshis): CacheKey =>
    JSON.stringify({
      id: paymentHash,
      mtokens: milliSats.toString(),
    }) as CacheKey

  return {
    generate,
  }
}
