import { SECS_PER_5_MINS } from "@config/app"
import { CouldNotFindError, UnknownRepositoryError } from "@domain/errors"
import { redis } from "@services/redis"

export const RoutesRepository = (): IRoutesRepository => {
  const persist = async ({
    key,
    routeToCache,
  }: {
    key: CacheKey
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

  const findByKey = async (key: CacheKey): Promise<CachedRoute | RepositoryError> => {
    try {
      const rawRouteString = await redis.get(key)
      if (!rawRouteString)
        return new CouldNotFindError("Couldn't find cached route for payment hash")
      return JSON.parse(rawRouteString)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const deleteByKey = async (key: CacheKey): Promise<true | RepositoryError> => {
    try {
      await redis.del(key)
      return true
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    persist,
    findByKey,
    deleteByKey,
  }
}
