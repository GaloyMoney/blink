import IbexSDK, { SignInResponse200 } from "../.api/apis/sing-in";
import { IBEX_EMAIL, IBEX_PASSWORD } from "@config"
import { IbexApiError, IbexAuthenticationError, IbexEventError } from "../errors"
import Redis from "./redis-datastore";
import { FetchResponse } from "api/dist/core";
import { CacheServiceError, CacheUndefinedError } from "@domain/cache";
import { baseLogger as log } from "@services/logger";
import { logResponse } from "../errors/logger";

// TODO: Divide this into setAccessToken and setRefreshToken which take Partial<SignInResponse200>
const storeTokens = async (signInResp: SignInResponse200): Promise<void> => {
    const { 
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt
    } = signInResp

    if (!accessToken) return Promise.reject(new IbexEventError("No access token found in Ibex response body"))
    const atResp = await Redis.setAccessToken(accessToken, accessTokenExpiresAt)
    IbexSDK.auth(accessToken)

    if (!refreshToken) return Promise.reject(new IbexEventError("No refresh token found in Ibex response body"))
    const rtResp = await Redis.setRefreshToken(refreshToken, refreshTokenExpiresAt)
    
    if (atResp instanceof CacheServiceError) log.warn(`IBEX: Failed to write accessToken to redis cache: ${atResp.message}`)
    if (rtResp instanceof CacheServiceError) log.warn(`IBEX: Failed to write refreshToken to redis cache: ${rtResp.message}`)
}

const signIn = async (): Promise<void | IbexApiError> => {
    log.info("IBEX: Signing in...")
    return IbexSDK.signIn({ email: IBEX_EMAIL, password: IBEX_PASSWORD })
        .then(_ => _.data)
        .then(_ => storeTokens(_))
        .catch(e => new IbexApiError(e.status, e.data))      
        .then(logResponse)      
}

const refreshAccessToken = async (): Promise<void | IbexAuthenticationError> => {
    log.info("IBEX: Refreshing token...")
    const tokenOrErr = await Redis.getRefreshToken()
    if (tokenOrErr instanceof CacheUndefinedError) {
        log.info("IBEX: Refresh token not found.")
        return await signIn().catch((e: IbexApiError) => new IbexAuthenticationError(e))
    }
    if (tokenOrErr instanceof CacheServiceError) return new IbexAuthenticationError(tokenOrErr)
    try {   
        const resp = (await IbexSDK.refreshAccessToken({ refreshToken: tokenOrErr })).data
        if (!resp.accessToken) return new IbexAuthenticationError("Did not receive access token")
        Redis.setAccessToken(resp.accessToken, resp.expiresAt)
        IbexSDK.auth(resp.accessToken)
    } catch (err: any) {
        if (err.status === 401) return await signIn().catch((e: IbexApiError) => new IbexAuthenticationError(e))
        else return new IbexAuthenticationError(err)
    }
}

// wraps Ibex api calls with authentication handling
export const withAuth = async <S, T>(apiCall: () => Promise<FetchResponse<S, T>>): Promise<T | IbexAuthenticationError> => {
    const atResp = await Redis.getAccessToken()

    if (atResp instanceof CacheUndefinedError) {
        log.info("IBEX: Access token not found.")
        const refreshResp = await refreshAccessToken()
        if (refreshResp instanceof IbexAuthenticationError) return refreshResp
    } else if (atResp instanceof CacheServiceError) return new IbexAuthenticationError(atResp)
    else IbexSDK.auth(atResp)

    try {
        return (await apiCall()).data
    } catch (err: any) {
        if (err.status === 401) {
            log.info("IBEX: Access token unauthorized.")
            const refreshResp = await refreshAccessToken()
            if (refreshResp instanceof IbexAuthenticationError) return refreshResp
            return (await apiCall()).data
        } else {
            throw err // rethrow non-401s
        }
    }
}
