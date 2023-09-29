import { getCallbackServiceConfig } from "@config"
import { InvalidUrlError } from "@domain/callback/errors"
import { CallbackService } from "@services/svix"
import { UnknownSvixError } from "@services/svix/errors"
import { z } from "zod"

export const addEndpoint = async ({
  accountUuid,
  url,
}: {
  accountUuid: AccountUuid
  url: string
}) => {
  const validationResult = z.string().url().safeParse(url)
  if (!validationResult.success) {
    return new InvalidUrlError(`${url} is invalid`)
  }

  const callbackService = CallbackService(getCallbackServiceConfig())
  const res = await callbackService.addEndpoint({ accountUuid, url })

  if (res instanceof Error) return res
  if (!res) throw new UnknownSvixError("CallbackService not configured")

  return { id: res.id }
}

export const listEndpoints = async (accountUuid: AccountUuid) => {
  const callbackService = CallbackService(getCallbackServiceConfig())
  const res = await callbackService.listEndpoints(accountUuid)

  if (res instanceof Error) return res
  return res
}

export const deleteEndpoint = async ({
  accountUuid,
  id,
}: {
  accountUuid: AccountUuid
  id: string
}) => {
  const callbackService = CallbackService(getCallbackServiceConfig())
  const success = await callbackService.deleteEndpoint({ accountUuid, endpointId: id })

  if (success instanceof Error) return success
  return success
}
