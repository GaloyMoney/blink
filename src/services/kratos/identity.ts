import { assert } from "console"

import { Identity as KratosIdentity } from "@ory/client"

import { isProd } from "@config"

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

// FIXME: there is a bug where page = 0 and page = 1 return the same result
// related bug: https://github.com/ory/kratos/issues/2834
// with 1, only 1 entry will be missing in the result
const perPage = isProd ? 50 : 3

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

  const listIdentities = async (): Promise<AnyIdentity[] | KratosError> => {
    try {
      const identities: KratosIdentity[] = []
      let totalCount = 0

      let hasNext = true

      let page: number | undefined = 0

      while (hasNext) {
        // Note: this call is paginated, return 250 records `perPage` by default
        const res = await kratosAdmin.listIdentities({ perPage, page })
        identities.push(...res.data)

        totalCount = Number(res.headers["x-total-count"])

        page = getNextPage(res.headers.link)
        hasNext = page !== undefined && totalCount !== 0
      }

      // * fixes bug in kratos res.headers.link not returning last page properly
      const pageCount = totalCount / perPage
      const isPageCountWholeNumber = pageCount % 1 // 0 means its a whole number, therefore, we can skip because no partial last page of data exists
      if (isPageCountWholeNumber !== 0) {
        const lastPageNum = Math.ceil(totalCount / perPage)
        const lastPageRes = await kratosAdmin.listIdentities({
          perPage,
          page: lastPageNum,
        })
        identities.push(...lastPageRes.data)
      }

      // FIXME(nb) function above return duplicated query for the first 2 calls, so removing them here
      const uniqueIdentities = identities.filter(
        (value, index, self) => index === self.findIndex((t) => t.id === value.id),
      )
      assert(
        totalCount == uniqueIdentities.length,
        `totalCount ${totalCount} doesn't match uniqueIdentities.length ${uniqueIdentities.length}`,
      )

      return uniqueIdentities.map(toDomainIdentity)
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
    listIdentities,
    deleteIdentity,
  }
}
