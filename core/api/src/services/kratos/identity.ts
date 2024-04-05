import { Identity as KratosIdentity } from "@ory/client"

import { recordExceptionInCurrentSpan } from "../tracing"

import { KratosError, UnknownKratosError } from "./errors"
import { getKratosPostgres, kratosAdmin, toDomainIdentity } from "./private"

import { IdentifierNotFoundError } from "@/domain/authentication/errors"
import { ErrorLevel } from "@/domain/shared"

export const getNextPageToken = (link: string): string | undefined => {
  const links = link.split(",")
  const nextLink = links.find((link) => link.includes('rel="next"'))

  if (nextLink) {
    const matches = nextLink.match(/page_token=([^;&>]+)/)
    if (matches) {
      return matches[1]
    }
  }

  return undefined
}

export const IdentityRepository = (): IIdentityRepository => {
  const getIdentity = async (
    kratosUserId: UserId,
  ): Promise<AnyIdentity | KratosError> => {
    let data: KratosIdentity

    try {
      const res = await kratosAdmin.getIdentity({ id: kratosUserId })
      data = res.data
    } catch (err) {
      return new UnknownKratosError(err)
    }

    return toDomainIdentity(data)
  }

  const listIdentities = async function* (): AsyncGenerator<AnyIdentity | KratosError> {
    try {
      const pageSize = 200
      let hasNext = true
      let pageToken: string | undefined = undefined

      while (hasNext) {
        const res = await kratosAdmin.listIdentities({ pageSize, pageToken })

        for (const identity of res.data) {
          yield toDomainIdentity(identity)
        }

        pageToken = getNextPageToken(res.headers.link)
        hasNext = !!pageToken && res.data.length > 0
      }
    } catch (err) {
      yield new UnknownKratosError(err)
    }
  }

  const getUserIdFromIdentifier = async (identifier: PhoneNumber | EmailAddress) => {
    try {
      const identity = await kratosAdmin.listIdentities({
        credentialsIdentifier: identifier,
      })
      if (identity.data.length === 0) return new IdentifierNotFoundError()

      const userId = identity.data[0].id as UserId
      if (!userId) return new IdentifierNotFoundError()
      return userId
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  const deleteIdentity = async (id: UserId): Promise<void | KratosError> => {
    try {
      await kratosAdmin.deleteIdentity({ id })
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  const getUserIdFromFlowId = async (flowId: string): Promise<UserId | KratosError> => {
    const kratosDbConnection = getKratosPostgres()
    const table = "selfservice_recovery_flows"

    try {
      const res = await kratosDbConnection
        .select(["id", "recovered_identity_id"])
        .from(table)
        .where({ id: flowId })

      await kratosDbConnection.destroy()

      if (res.length === 0) {
        return new UnknownKratosError(`no identity for flow ${flowId}`)
      }

      return res[0].recovered_identity_id as UserId
    } catch (err) {
      if (err instanceof AggregateError && err.errors.length) {
        for (const individualError of err.errors.slice(1)) {
          recordExceptionInCurrentSpan({
            error: new UnknownKratosError(individualError),
            level: ErrorLevel.Critical,
          })
        }

        return new UnknownKratosError(err.errors[0])
      }

      return new UnknownKratosError(err)
    }
  }

  return {
    getIdentity,
    listIdentities,
    deleteIdentity,
    getUserIdFromIdentifier,
    getUserIdFromFlowId,
  }
}
