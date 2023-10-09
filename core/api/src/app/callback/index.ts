import { z } from "zod"

import { getCallbackServiceConfig } from "@/config"
import { InvalidUrlError } from "@/domain/callback/errors"
import { CallbackService } from "@/services/svix"
import { UnknownSvixError } from "@/services/svix/errors"

export const addEndpoint = async ({
  accountId,
  url,
}: {
  accountId: AccountId
  url: string
}) => {
  const validationResult = z.string().url().safeParse(url)
  if (!validationResult.success) {
    return new InvalidUrlError(`${url} is invalid`)
  }

  const callbackService = CallbackService(getCallbackServiceConfig())
  const res = await callbackService.addEndpoint({ accountId, url })

  if (res instanceof Error) return res
  if (!res) throw new UnknownSvixError("CallbackService not configured")

  return { id: res.id }
}

export const listEndpoints = async (accountId: AccountId) => {
  const callbackService = CallbackService(getCallbackServiceConfig())
  const res = await callbackService.listEndpoints(accountId)

  if (res instanceof Error) return res
  return res
}

export const deleteEndpoint = async ({
  accountId,
  id,
}: {
  accountId: AccountId
  id: string
}) => {
  const callbackService = CallbackService(getCallbackServiceConfig())
  const success = await callbackService.deleteEndpoint({ accountId, endpointId: id })

  if (success instanceof Error) return success
  return success
}
