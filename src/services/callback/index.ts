import { ApplicationIn, Svix } from "svix"

import { baseLogger } from "@services/logger"

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

    try {
      const application: ApplicationIn = {
        name: `callback for account ${accountUUID}`,
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

  return { sendMessage, getWebsocketPortal, addEndpoint, listEndpoints, removeEndpoint }
}
