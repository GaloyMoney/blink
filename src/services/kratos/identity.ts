import { assert } from "console"

import { isDev } from "@config"
import { UnknownKratosError } from "@domain/authentication/errors"
import { Identity } from "@ory/client"

import { kratosAdmin, toDomainIdentityPhone } from "./private"

export const getNextPage = (link: string): number | undefined => {
  const links = link.split(",")
  const next = links.find((l) => l.includes('rel="next"'))
  if (!next) return undefined

  const nextSplit = next.split("page=")
  const page = +nextSplit[1].replace(/\D+/g, "")
  return page
}

// FIXME: there is a bug where page = 0 and page = 1 return the same result
// related bug: https://github.com/ory/kratos/issues/2834
// with 1, only 1 entry will be missing in the result
const perPage = isDev ? 3 : 50

export const listIdentities = async (): Promise<IdentityPhone[] | KratosError> => {
  try {
    const identities: Identity[] = []
    let totalCount = 0

    let hasNext = true

    let page: number | undefined = 0

    while (hasNext) {
      // Note: this call is paginated, return 250 records `perPage` by default
      const res = await kratosAdmin.adminListIdentities(perPage, page)
      identities.push(...res.data)

      totalCount = Number(res.headers["x-total-count"])

      page = getNextPage(res.headers.link)
      hasNext = page !== undefined && totalCount !== 0
    }

    // FIXME(nb) function above return duplicated query for the first 2 calls, so removing them here
    const uniqueIdentities = identities.filter(
      (value, index, self) => index === self.findIndex((t) => t.id === value.id),
    )
    assert(totalCount == uniqueIdentities.length)

    return uniqueIdentities.map(toDomainIdentityPhone)
  } catch (err) {
    return new UnknownKratosError(err)
  }
}
