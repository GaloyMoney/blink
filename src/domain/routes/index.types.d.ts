type ProbeForRouteArgs = import("lightning").ProbeForRouteArgs
type RawHopWithNumbers = NonNullable<ProbeForRouteArgs["routes"]>[number][number]

type PayViaPaymentDetailsArgs = import("lightning").PayViaPaymentDetailsArgs
type RawHopWithStrings = NonNullable<PayViaPaymentDetailsArgs["routes"]>[number][number]

type PayViaRoutesArgs = import("lightning").PayViaRoutesArgs
type RawRouteFromProbe = PayViaRoutesArgs["routes"][number]
type RawRoute = { safe_fee: number } & RawRouteFromProbe
type Route = { roundedUpFee: Satoshis; roundedDownFee: Satoshis }

type CachedRoute = { pubkey: Pubkey; route: RawRoute }

declare const cacheKeySymbol: unique symbol
type CacheKey = string & { [cacheKeySymbol]: never }

type CachedRouteKeyGenerator = {
  generate(milliSatsAmounts: MilliSatoshis): CacheKey
}

interface IRoutesRepository {
  persist: ({
    key,
    routeToCache,
  }: {
    key
    routeToCache: CachedRoute
    time?: Seconds
  }) => Promise<CachedRoute | RepositoryError>

  findByKey: (key: CacheKey) => Promise<CachedRoute | RepositoryError>

  deleteByKey: (key: CacheKey) => Promise<true | RepositoryError>
}
