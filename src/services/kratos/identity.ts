import { Identity as KratosIdentity } from "@ory/client"

import { IdentifierNotFoundError } from "@domain/authentication/errors"

import { KratosError, UnknownKratosError } from "./errors"
import { kratosAdmin, toDomainIdentity } from "./private"

export const getNextPage = (link: string): number | undefined => {
  const links = link.split(",")
  const next = links.find((l) => l.includes('rel="next"'))
  if (!next) return undefined

  const nextSplit = next.split("page=")
  const splittingOnNumber = nextSplit[1].match(/^\d+&/)
  if (splittingOnNumber === null) return undefined

  const page = +splittingOnNumber[0].slice(0, -1)
  return page
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

  return {
    getIdentity,
    getUserIdFromIdentifier,
    deleteIdentity,
  }
}
