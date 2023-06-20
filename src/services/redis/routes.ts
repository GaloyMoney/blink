import { defaultTimeToExpiryInSeconds } from "@domain/bitcoin/lightning/invoice-expiration"
import { CouldNotFindError, UnknownRepositoryError } from "@domain/errors"

import { redis } from "./connection"

export const RoutesCache = (): IRoutesCache => {
  const store = async ({
    key,
    routeToCache,
  }: {
    key: CachedRouteLookupKey
    routeToCache: CachedRoute
  }): Promise<CachedRoute | RepositoryError> => {
    try {
      const value = JSON.stringify(routeToCache)
      await redis.set(key, value, "EX", defaultTimeToExpiryInSeconds)
      return routeToCache
    } catch (err) {
      if (err instanceof Error) return new UnknownRepositoryError(err.message)
      return new UnknownRepositoryError()
    }
  }

  const findByKey = async (
    key: CachedRouteLookupKey,
  ): Promise<CachedRoute | RepositoryError> => {
    try {
      const rawRouteString = await redis.get(key)
      if (!rawRouteString)
        return new CouldNotFindError("Couldn't find cached route for payment hash")
      return JSON.parse(rawRouteString)
    } catch (err) {
      if (err instanceof Error) return new UnknownRepositoryError(err.message)
      return new UnknownRepositoryError()
    }
  }

  return {
    store,
    findByKey,
  }
}
