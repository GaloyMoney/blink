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
  secret: string
  endpoint: string
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
    accountUUID,
    payload,
  }: {
    eventType: string
    accountUUID: string
    payload: Record<string, string>
  }) => {
    const accountPath = `account.${accountUUID}`
    addAttributesToCurrentSpan({ "callback.application": accountPath })

    try {
      const application: ApplicationIn = {
        name: accountPath,
        uid: accountPath,
      }

      await svix.application.create(application)
    } catch (err) {
      if ((err as SvixError).code === 409) {
        // we create app on the fly, so we are expect this error and can ignore it
      } else {
        return new UnknownSvixError(err)
      }
    }

    try {
      const res = await svix.message.create(accountPath, {
        eventType,
        payload: { ...payload, accountId: accountUUID, eventType },
      })

      const prefixedPayload = prefixObjectKeys(payload, "callback.payload.")
      addAttributesToCurrentSpan({
        ...prefixedPayload,
        ["callback.accountId"]: accountUUID,
        ["callback.eventType"]: eventType,
      })
      baseLogger.info({ res }, `message sent successfully to ${accountPath}`)
      return res
    } catch (err) {
      return new UnknownSvixError(err)
    }
  }

  // only work for hosted svix
  const getWebsocketPortal = async (accountUUID: AccountUUID) => {
    try {
      const res = await svix.authentication.appPortalAccess(accountUUID, {})
      return res
    } catch (err) {
      return new UnknownSvixError(err)
    }
  }

  const addEndpoint = async (accountUUID: AccountUUID, url: string) => {
    try {
      const res = await svix.endpoint.create(accountUUID, {
        url,
      })
      return res
    } catch (err) {
      return new UnknownSvixError(err)
    }
  }

  const listEndpoints = async (accountUUID: AccountUUID) => {
    try {
      const res = await svix.endpoint.list(accountUUID)
      return res
    } catch (err) {
      return new UnknownSvixError(err)
    }
  }

  const removeEndpoint = async (accountUUID: AccountUUID, endpointId: string) => {
    try {
      await svix.endpoint.delete(accountUUID, endpointId)
    } catch (err) {
      return new UnknownSvixError(err)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.callback",
    fns: { sendMessage, getWebsocketPortal, addEndpoint, listEndpoints, removeEndpoint },
  })
}
