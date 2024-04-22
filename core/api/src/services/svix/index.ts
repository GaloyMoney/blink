import { ApplicationIn, Svix } from "svix"

import { SvixError, UnknownSvixError } from "./errors"

import { CallbackError, InvalidUrlError } from "@/domain/callback/errors"
import { parseErrorMessageFromUnknown } from "@/domain/shared"

import {
  addAttributesToCurrentSpan,
  wrapAsyncFunctionsToRunInSpan,
} from "@/services/tracing"
import { baseLogger } from "@/services/logger"

function prefixObjectKeys(
  obj: Record<string, JSONValue>,
  prefix: string,
): Record<string, string> {
  return Object.keys(obj).reduce<Record<string, string>>((acc, key) => {
    const newKey = `${prefix}.${key}`

    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      const flattenedSubObject = prefixObjectKeys(
        obj[key] as Record<string, JSONValue>,
        newKey,
      )
      return { ...acc, ...flattenedSubObject }
    }

    acc[newKey] = `${obj[key]}`
    return acc
  }, {})
}

export const CallbackService = (config: SvixConfig): ICallbackService => {
  if (!config.secret) {
    const nullFn = async () => {
      baseLogger.warn("CallbackService not configured")
      return new UnknownSvixError("CallbackService not configured")
    }
    return {
      sendMessage: nullFn,
      getPortalUrl: nullFn,
      addEndpoint: nullFn,
      listEndpoints: nullFn,
      deleteEndpoint: nullFn,
    }
  }

  const svix = config.endpoint
    ? new Svix(config.secret, { serverUrl: config.endpoint })
    : new Svix(config.secret)

  const getAccountCallbackId = (accountId: AccountId): AccountCallbackId =>
    `account.${accountId}` as AccountCallbackId

  const createApplication = async (accountCallbackId: AccountCallbackId) => {
    try {
      const application: ApplicationIn = {
        name: accountCallbackId,
        uid: accountCallbackId,
      }

      await svix.application.create(application)
    } catch (err) {
      if ((err as SvixError).code === 409) {
        // we create app on the fly, so we are expecting this error and can ignore it
      } else {
        return handleCommonErrors(err)
      }
    }
  }

  const sendMessage = async ({
    eventType,
    accountId,
    walletId,
    payload,
  }: {
    eventType: string
    accountId: AccountId
    walletId: WalletId
    payload: Record<string, JSONValue>
  }): Promise<CallbackError | true> => {
    const accountCallbackId = getAccountCallbackId(accountId)
    addAttributesToCurrentSpan({ "callback.application": accountCallbackId })
    try {
      const result = await createApplication(accountCallbackId)
      if (result instanceof Error) return result

      const safePayload = JSON.parse(
        JSON.stringify(payload, (_key, value) =>
          typeof value === "bigint" ? value.toString() : value,
        ),
      )
      const res = await svix.message.create(accountCallbackId, {
        eventType,
        payload: { ...safePayload, accountId, walletId, eventType },
      })

      const prefixedPayload = prefixObjectKeys(safePayload, "callback.payload")
      addAttributesToCurrentSpan({
        ...prefixedPayload,
        ["callback.accountId"]: accountId,
        ["callback.walletId"]: walletId,
        ["callback.eventType"]: eventType,
      })
      baseLogger.info({ res }, `message sent successfully to ${accountCallbackId}`)
      return true
    } catch (err) {
      return handleCommonErrors(err)
    }
  }

  // only work for hosted svix
  const getPortalUrl = async (accountId: AccountId) => {
    const accountCallbackId = getAccountCallbackId(accountId)

    const res = await createApplication(accountCallbackId)
    if (res instanceof Error) return res

    try {
      const res = await svix.authentication.appPortalAccess(accountCallbackId, {})
      return res.url
    } catch (err) {
      return handleCommonErrors(err)
    }
  }

  const addEndpoint = async ({
    accountId,
    url,
  }: {
    accountId: AccountId
    url: string
  }) => {
    const accountCallbackId = getAccountCallbackId(accountId)

    const res = await createApplication(accountCallbackId)
    if (res instanceof Error) return res

    try {
      const res = await svix.endpoint.create(accountCallbackId, {
        url,
      })
      return res.id
    } catch (err) {
      return handleCommonErrors(err)
    }
  }

  const listEndpoints = async (accountId: AccountId) => {
    const accountCallbackId = getAccountCallbackId(accountId)

    const res = await createApplication(accountCallbackId)
    if (res instanceof Error) return res

    try {
      const res = await svix.endpoint.list(accountCallbackId)
      const res2 = res.data.map((endpoint) => ({ id: endpoint.id, url: endpoint.url }))
      return res2
    } catch (err) {
      return handleCommonErrors(err)
    }
  }

  const deleteEndpoint = async ({
    accountId,
    endpointId,
  }: {
    accountId: AccountId
    endpointId: string
  }) => {
    const accountCallbackId = getAccountCallbackId(accountId)

    try {
      await svix.endpoint.delete(accountCallbackId, endpointId)
      return true
    } catch (err) {
      return handleCommonErrors(err)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.callback",
    fns: { sendMessage, getPortalUrl, addEndpoint, listEndpoints, deleteEndpoint },
  })
}

const handleCommonErrors = (err: Error | string | unknown) => {
  const errMsg = parseErrorMessageFromUnknown(err)

  const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errMsg)

  switch (true) {
    case match(KnownSvixErrorMessages.InvalidUrlProtocol):
      return new InvalidUrlError("URL must have a valid protocol")
    case match(KnownSvixErrorMessages.InvalidHttpsUrl):
      return new InvalidUrlError("URL must be https")

    default:
      return new UnknownSvixError(errMsg)
  }
}
export const KnownSvixErrorMessages = {
  InvalidHttpsUrl: /endpoint_https_only/,
  InvalidUrlProtocol: /must be http or https/,
} as const
