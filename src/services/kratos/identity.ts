import { assert } from "console"

import { Identity } from "@ory/client"

import { isDev } from "@config"

import { PhoneIdentityDoesNotExistError } from "@domain/authentication/errors"

import { KratosError, UnknownKratosError } from "./errors"
import { kratosAdmin, toDomainIdentityPhone } from "./private"

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
const perPage = isDev ? 3 : 50

export const IdentityRepository = (): IIdentityRepository => {
  const getIdentity = async (
    kratosUserId: UserId,
  ): Promise<IdentityPhone | KratosError> => {
    let data: Identity

    try {
      const res = await kratosAdmin.getIdentity({ id: kratosUserId })
      data = res.data
    } catch (err) {
      return new UnknownKratosError(err)
    }

    return toDomainIdentityPhone(data)
  }

  const listIdentities = async (): Promise<IdentityPhone[] | KratosError> => {
    try {
      const identities: Identity[] = []
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

      // FIXME(nb) function above return duplicated query for the first 2 calls, so removing them here
      const uniqueIdentities = identities.filter(
        (value, index, self) => index === self.findIndex((t) => t.id === value.id),
      )
      assert(
        totalCount == uniqueIdentities.length,
        `totalCount ${totalCount} doesn't match uniqueIdentities.length ${uniqueIdentities.length}`,
      )

      return uniqueIdentities.map(toDomainIdentityPhone)
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  // only use for non public endpoint for now
  // because there is no index/go through all records
  const slowFindByPhone = async (
    phone: PhoneNumber,
  ): Promise<IdentityPhone | KratosError> => {
    let identities: Identity[]

    try {
      const res = await kratosAdmin.listIdentities()
      identities = res.data
    } catch (err) {
      return new UnknownKratosError(err)
    }

    const identity = identities.find((identity) => identity.traits.phone === phone)

    if (!identity) return new PhoneIdentityDoesNotExistError(phone)

    return toDomainIdentityPhone(identity)
  }

  return {
    getIdentity,
    listIdentities,
    slowFindByPhone,
  }
}
