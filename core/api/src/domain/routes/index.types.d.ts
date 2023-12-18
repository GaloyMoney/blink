type ProbeForRouteArgs = import("lightning").ProbeForRouteArgs
type ProbeForRouteRoutes = import("lightning").ProbeForRouteRoutes

type PayViaPaymentDetailsArgs = import("lightning").PayViaPaymentDetailsArgs
type RawHopWithStrings = NonNullable<PayViaPaymentDetailsArgs["routes"]>[number][number]

type ProbeForRouteResult = import("lightning").ProbeForRouteResult
type RawRoute = NonNullable<ProbeForRouteResult["route"]>
type Route = { roundedUpFee: Satoshis }

type CachedRoute = { pubkey: Pubkey; route: RawRoute }

type CachedRouteLookupKey = string & { readonly brand: unique symbol }
type CachedRouteLookupKeyFactory = {
  createFromMilliSats(args: {
    paymentHash: PaymentHash
    milliSats: MilliSatoshis
  }): CachedRouteLookupKey
  createFromCents(args: {
    paymentHash: PaymentHash
    cents: UsdCents
  }): CachedRouteLookupKey
}

interface IRoutesCache {
  store: ({
    key,
    routeToCache,
  }: {
    key: CachedRouteLookupKey
    routeToCache: CachedRoute
  }) => Promise<CachedRoute | RepositoryError>

  findByKey: (key: CachedRouteLookupKey) => Promise<CachedRoute | RepositoryError>
}
