type ProbeForRouteArgs = import("lightning").ProbeForRouteArgs
type RawHopWithNumbers = NonNullable<ProbeForRouteArgs["routes"]>[number][number]

type PayViaPaymentDetailsArgs = import("lightning").PayViaPaymentDetailsArgs
type RawHopWithStrings = NonNullable<PayViaPaymentDetailsArgs["routes"]>[number][number]

type PayViaRoutesArgs = import("lightning").PayViaRoutesArgs
type RawRouteFromProbe = PayViaRoutesArgs["routes"][number]
type RawRoute = { safe_fee: number } & RawRouteFromProbe
type Route = { roundedUpFee: Satoshis }

type CachedRoute = { pubkey: Pubkey; route: RawRoute }

declare const cachedRouteLookupKeySymbol: unique symbol
type CachedRouteLookupKey = string & { [cachedRouteLookupKeySymbol]: never }

type CachedRouteLookupKeyFactory = {
  create(args: {
    paymentHash: PaymentHash
    milliSats: MilliSatoshis
  }): CachedRouteLookupKey
}

interface IRoutesCache {
  store: ({
    key,
    routeToCache,
  }: {
    key
    routeToCache: CachedRoute
  }) => Promise<CachedRoute | RepositoryError>

  findByKey: (key: CachedRouteLookupKey) => Promise<CachedRoute | RepositoryError>
}
