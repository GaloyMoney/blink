import { getCallbackServiceConfig } from "@config"
import { InvalidUrlError } from "@domain/callback/errors"
import { CallbackService } from "@services/svix"
import { z } from "zod"

const urlSchema = z.string().refine(
  (value) => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  },
  {
    message: "Invalid URL",
  },
)

export const addEndpoint = async ({
  accountUuid,
  url,
}: {
  accountUuid: AccountUuid
  url: string
}) => {
  const validationResult = urlSchema.safeParse(url)
  if (!validationResult.success) {
    return new InvalidUrlError(`${url} is invalid`)
  }

  const callbackService = CallbackService(getCallbackServiceConfig())
  const res = await callbackService.addEndpoint(accountUuid, url)

  if (res instanceof Error) return res
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
  const res = await callbackService.deleteEndpoint({ accountUuid, endpointId: id })

  if (res instanceof Error) return res
  return res
}
