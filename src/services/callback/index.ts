import { ApplicationIn, Svix } from "svix"

import { baseLogger } from "@services/logger"

import {
  addAttributesToCurrentSpan,
  wrapAsyncFunctionsToRunInSpan,
} from "@services/tracing"

import { UnknownSvixError } from "./error"

interface SvixErrorBody {
  code: string
  detail: string
}

interface SvixError extends Error {
  code: number
  body: SvixErrorBody
}

export type SvixConfig = {
  secret?: string
  endpoint?: string | null
}

function prefixObjectKeys(
  obj: Record<string, string>,
  prefix: string,
): Record<string, string> {
  return Object.keys(obj).reduce(
    (acc, key) => {
      acc[`${prefix}${key}`] = obj[key]
      return acc
    },
    {} as Record<string, string>,
  )
}

export const CallbackService = (config: SvixConfig) => {
  if (!config.secret) {
    const nullFn = async () => {
      null
    }
    return {
      sendMessage: nullFn,
      getWebsocketPortal: nullFn,
      addEndpoint: nullFn,
      listEndpoints: nullFn,
      removeEndpoint: nullFn,
    }
  }

  const svix = config.endpoint
    ? new Svix(config.secret, { serverUrl: config.endpoint })
    : new Svix(config.secret)

  const sendMessage = async ({
    eventType,
    accountUuid,
    payload,
  }: {
    eventType: string
    accountUuid: string
    payload: Record<string, string>
  }) => {
    const accountPath = `account.${accountUuid}`
    addAttributesToCurrentSpan({ "callback.application": accountPath })

    try {
      const application: ApplicationIn = {
        name: accountPath,
        uid: accountPath,
      }

      await svix.application.create(application)
    } catch (err) {
      if ((err as SvixError).code === 409) {
        // we create app on the fly, so we are expecting this error and can ignore it
      } else {
        return new UnknownSvixError(err)
      }
    }

    try {
      const res = await svix.message.create(accountPath, {
        eventType,
        payload: { ...payload, accountId: accountUuid, eventType },
      })

      const prefixedPayload = prefixObjectKeys(payload, "callback.payload.")
      addAttributesToCurrentSpan({
        ...prefixedPayload,
        ["callback.accountId"]: accountUuid,
        ["callback.eventType"]: eventType,
      })
      baseLogger.info({ res }, `message sent successfully to ${accountPath}`)
      return res
    } catch (err) {
      return new UnknownSvixError(err)
    }
  }

  // only work for hosted svix
  const getWebsocketPortal = async (accountUuid: AccountUuid) => {
    try {
      const res = await svix.authentication.appPortalAccess(accountUuid, {})
      return res
    } catch (err) {
      return new UnknownSvixError(err)
    }
  }

  const addEndpoint = async (accountUuid: AccountUuid, url: string) => {
    try {
      const res = await svix.endpoint.create(accountUuid, {
        url,
      })
      return res
    } catch (err) {
      return new UnknownSvixError(err)
    }
  }

  const listEndpoints = async (accountUuid: AccountUuid) => {
    try {
      const res = await svix.endpoint.list(accountUuid)
      return res
    } catch (err) {
      return new UnknownSvixError(err)
    }
  }

  const removeEndpoint = async (accountUuid: AccountUuid, endpointId: string) => {
    try {
      await svix.endpoint.delete(accountUuid, endpointId)
    } catch (err) {
      return new UnknownSvixError(err)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.callback",
    fns: { sendMessage, getWebsocketPortal, addEndpoint, listEndpoints, removeEndpoint },
  })
}
