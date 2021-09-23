type ProbeForRouteArgs = import("lightning").ProbeForRouteArgs
type RawHopWithNumbers = NonNullable<ProbeForRouteArgs["routes"]>[number][number]

type PayViaPaymentDetailsArgs = import("lightning").PayViaPaymentDetailsArgs
type RawHopWithStrings = NonNullable<PayViaPaymentDetailsArgs["routes"]>[number][number]

type PayViaRoutesArgs = import("lightning").PayViaRoutesArgs
type RawRouteFromProbe = PayViaRoutesArgs["routes"][number]
type RawRoute = { safe_fee: number } & RawRouteFromProbe
type Route = { roundedUpFee: Satoshis; roundedDownFee: Satoshis }

type CachedRoute = { pubkey: Pubkey; route: RawRoute }

interface IRoutesRepository {
  findByPaymentHash: ({
    paymentHash,
    milliSatsAmounts,
  }: {
    paymentHash: PaymentHash
    milliSatsAmounts: MilliSatoshis
  }) => Promise<CachedRoute | RepositoryError>

  deleteByPaymentHash: ({
    paymentHash,
    milliSatsAmounts,
  }: {
    paymentHash: PaymentHash
    milliSatsAmounts: MilliSatoshis
  }) => Promise<void | RepositoryError>
}
