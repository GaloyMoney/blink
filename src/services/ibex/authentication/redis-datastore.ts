import { RedisCacheService } from "@services/cache"

const KEYS = {
    accessToken: "ibex:accessToken",
    refreshToken: "ibex:refreshToken"
}

// Requires testing
const ttl = (expiresAt?: number): Seconds | undefined => {
    if (!expiresAt) return undefined
    const ttl = Math.floor(
        ((expiresAt * 1000) - Date.now()) / 1000
    ) as Seconds
    return ttl > 0 ? ttl : undefined
}

export default class RedisDatastore {
    private constructor() {}

    static getAccessToken = (): Promise<string | CacheServiceError> => {
        return RedisCacheService().get({ key: KEYS.accessToken })
    }

    static setAccessToken = (token: string, expiresAt?: number): Promise<string | CacheServiceError> => {
        return RedisCacheService().set({
            key: KEYS.accessToken,
            value: token as NonError<string>,
            ttlSecs: ttl(expiresAt) || 86400 as Seconds // default to 1 day
        })
    }

    static getRefreshToken = (): Promise<string | CacheServiceError> => {
        return RedisCacheService().get({ key: KEYS.refreshToken })
    }

    static setRefreshToken = (token: string, expiresAt?: number): Promise<string | CacheServiceError> => {
        return RedisCacheService().set({
            key: KEYS.refreshToken,
            value: token as NonError<string>,
            ttlSecs: ttl(expiresAt) || 604800 as Seconds // defaults to 7 days
        })
    }
}
