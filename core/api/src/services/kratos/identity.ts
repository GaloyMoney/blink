import { Identity as KratosIdentity } from "@ory/client"

import { KratosError, UnknownKratosError } from "./errors"
import { kratosAdmin, toDomainIdentity } from "./private"

import { IdentifierNotFoundError } from "@/domain/authentication/errors"
import { AuthWithPhonePasswordlessService } from "./auth-phone-no-password"
import { AuthWithEmailPasswordlessService } from "./auth-email-no-password"

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

  return {
    getIdentity,
    listIdentities,
    getUserIdFromIdentifier,
    deleteIdentity,
  }
}

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

export const getAuthTokenFromUserId = async (
  userId: UserId,
): Promise<AuthToken | AuthenticationError> => {
  const { data } = await kratosAdmin.getIdentity({ id: userId })
  let kratosResult:
    | IAuthWithEmailPasswordlessService
    | LoginWithPhoneNoPasswordSchemaResponse
    | KratosError
    | null = null

  const phone = data?.traits?.phone
  const email = data?.traits?.email

  if (phone) {
    const authService = AuthWithPhonePasswordlessService()
    kratosResult = await authService.loginToken({ phone })
  } else if (email) {
    const emailAuthService = AuthWithEmailPasswordlessService()
    kratosResult = await emailAuthService.loginToken({ email })
  } else {
    return new IdentifierNotFoundError()
  }

  if (kratosResult instanceof Error) {
    return kratosResult
  }

  return kratosResult?.authToken
}
