import { redis } from "./connection"

import { defaultTimeToExpiryInSeconds } from "@/domain/bitcoin/lightning/invoice-expiration"
import { CouldNotFindError, UnknownRepositoryError } from "@/domain/errors"

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
      return new UnknownRepositoryError(err)
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
      return new UnknownRepositoryError(err)
    }
  }

  return {
    store,
    findByKey,
  }
}
