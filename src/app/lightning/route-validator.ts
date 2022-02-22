import { BadAmountForRouteError } from "@domain/errors"

export const RouteValidator = (rawRoute: RawRoute): RouteValidator => {
  const validate = (amount): true | ApplicationError => {
    const rawTokens = Math.floor(parseInt(rawRoute.total_mtokens || "0", 10) / 1000)
    if (amount !== rawTokens) {
      return new BadAmountForRouteError(`${amount} !== ${rawTokens}`)
    }

    return true
  }

  return {
    validate,
  }
}
