import { SECS_PER_5_MINS } from "@config/app"
import { CouldNotFindError, UnknownRepositoryError } from "@domain/errors"
import { redis } from "@services/redis"

export const RoutesRepository = (): IRoutesRepository => {
  const persistByPaymentHash = async ({
    paymentHash,
    milliSatsAmounts,
    routeToCache,
    time = SECS_PER_5_MINS,
  }: {
    paymentHash: PaymentHash
    milliSatsAmounts: MilliSatoshis
    routeToCache: CachedRoute
    time?: Seconds
  }): Promise<true | RepositoryError> => {
    try {
      const key = JSON.stringify({
        id: paymentHash,
        mtokens: milliSatsAmounts.toString(),
      })
      const value = JSON.stringify(routeToCache)
      await redis.set(key, value, "EX", time)
      return true
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findByPaymentHash = async ({
    paymentHash,
    milliSatsAmounts,
  }: {
    paymentHash: PaymentHash
    milliSatsAmounts: MilliSatoshis
  }): Promise<CachedRoute | RepositoryError> => {
    try {
      const key = JSON.stringify({
        id: paymentHash,
        mtokens: milliSatsAmounts.toString(),
      })
      const rawRouteString = await redis.get(key)
      if (!rawRouteString)
        return new CouldNotFindError("Couldn't find cached route for payment hash")
      return JSON.parse(rawRouteString)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const deleteByPaymentHash = async ({
    paymentHash,
    milliSatsAmounts,
  }: {
    paymentHash: PaymentHash
    milliSatsAmounts: MilliSatoshis
  }): Promise<void | RepositoryError> => {
    try {
      const key = JSON.stringify({ id: paymentHash, mtokens: milliSatsAmounts })
      await redis.del(key)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    persistByPaymentHash,
    findByPaymentHash,
    deleteByPaymentHash,
  }
}
