import { BadAmountForRouteError } from "@domain/errors"

export const RouteValidator = (rawRoute: RawRoute): RouteValidator => {
  const validate = (btcPaymentAmount: BtcPaymentAmount): true | ApplicationError => {
    const rawTokens = Math.floor(parseInt(rawRoute.total_mtokens || "0", 10) / 1000)
    const amount = Number(btcPaymentAmount.amount)
    if (amount !== rawTokens) {
      return new BadAmountForRouteError(`${amount} !== ${rawTokens}`)
    }

    return true
  }

  return {
    validate,
  }
}
