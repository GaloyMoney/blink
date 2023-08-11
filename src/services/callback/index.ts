import { ApplicationIn, Svix } from "svix"

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
  if (!config.secret || !config.endpoint) {
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

  const svix = new Svix(config.secret, { serverUrl: config.endpoint })

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
        console.log(err)
        // TODO: return Error
      }
    }

    try {
      const res = await svix.message.create(accountPath, {
        eventType,
        payload: { ...payload, accountId: accountUUID, eventType },
      })
      console.log({ res }, `message sent successfully to ${accountPath}`)
      return res
    } catch (err) {
      console.log(err)
    }
  }

  // only work for hosted svix
  const getWebsocketPortal = async (accountUUID: AccountUUID) => {
    return svix.authentication.appPortalAccess(accountUUID, {})
  }

  const addEndpoint = async (accountUUID: AccountUUID, url: string) => {
    return svix.endpoint.create(accountUUID, {
      url,
    })
  }

  const listEndpoints = async (accountUUID: AccountUUID) => {
    return svix.endpoint.list(accountUUID)
  }

  const removeEndpoint = async (accountUUID: AccountUUID, endpointId: string) => {
    return svix.endpoint.delete(accountUUID, endpointId)
  }

  return { sendMessage, getWebsocketPortal, addEndpoint, listEndpoints, removeEndpoint }
}
