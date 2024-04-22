import { z } from "zod"

import { getCallbackServiceConfig } from "@/config"
import { InvalidUrlError } from "@/domain/callback/errors"
import { CallbackService } from "@/services/svix"
import { UnknownSvixError } from "@/services/svix/errors"
import { checkedToAccountId } from "@/domain/accounts"

export const addEndpoint = async ({
  accountId: accountIdRaw,
  url,
}: {
  accountId: string
  url: string
}) => {
  const validationResult = z.string().url().safeParse(url)
  if (!validationResult.success) {
    return new InvalidUrlError(`${url} is invalid`)
  }

  const accountId = checkedToAccountId(accountIdRaw)
  if (accountId instanceof Error) return accountId

  const callbackService = CallbackService(getCallbackServiceConfig())
  const endpointId = await callbackService.addEndpoint({ accountId, url })

  if (endpointId instanceof Error) return endpointId
  if (!endpointId) throw new UnknownSvixError("CallbackService not configured")

  return { id: endpointId }
}

export const listEndpoints = async (accountIdRaw: string) => {
  const accountId = checkedToAccountId(accountIdRaw)
  if (accountId instanceof Error) return accountId

  const callbackService = CallbackService(getCallbackServiceConfig())
  return callbackService.listEndpoints(accountId)
}

export const deleteEndpoint = async ({
  accountId,
  id,
}: {
  accountId: AccountId
  id: string
}) => {
  const callbackService = CallbackService(getCallbackServiceConfig())
  return callbackService.deleteEndpoint({ accountId, endpointId: id })
}

export const getPortalUrl = async ({ accountId }: { accountId: AccountId }) => {
  const callbackService = CallbackService(getCallbackServiceConfig())
  return callbackService.getPortalUrl(accountId)
}
