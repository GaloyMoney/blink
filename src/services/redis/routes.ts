import { SECS_PER_5_MINS } from "@config"
import { CouldNotFindError, UnknownRepositoryError } from "@domain/errors"

import { redis } from "./index"

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
      await redis.set(key, value, "EX", SECS_PER_5_MINS)
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
