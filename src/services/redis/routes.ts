import { CouldNotFindError, UnknownRepositoryError } from "@domain/errors"
import { redis } from "@services/redis"

export const RoutesRepository = (): IRoutesRepository => {
  const findByPaymentHash = async ({
    paymentHash,
    milliSatsAmounts,
  }: {
    paymentHash: PaymentHash
    milliSatsAmounts: MilliSatoshis
  }): Promise<CachedRoute | RepositoryError> => {
    try {
      const key = JSON.stringify({ id: paymentHash, mtokens: milliSatsAmounts })
      const rawRouteString = await redis.get(key)
      if (!rawRouteString)
        return new CouldNotFindError("Couldn't find cached route for payment hash")
      return JSON.parse(rawRouteString) as CachedRoute
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
    findByPaymentHash,
    deleteByPaymentHash,
  }
}
