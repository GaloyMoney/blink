import { checkedToSats, toSats } from "@domain/bitcoin"
import {
  decodeInvoice,
  LnFeeCalculator,
  RouteNotFoundError,
} from "@domain/bitcoin/lightning"
import { LnPaymentRequestZeroAmountRequiredError } from "@domain/errors"
import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"
import { LndService } from "@services/lnd"
import { RoutesCache } from "@services/redis/routes"

export const lnInvoiceFeeProbe = async ({
  paymentRequest,
}: {
  paymentRequest: EncodedPaymentRequest
}): Promise<Satoshis | ApplicationError> => {
  const decodedInvoice = await decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice
  const paymentAmount = checkedToSats(decodedInvoice.amount || 0)
  if (paymentAmount instanceof Error) return paymentAmount

  return feeProbe({ decodedInvoice, paymentAmount })
}

export const lnNoAmountInvoiceFeeProbe = async ({
  paymentRequest,
  amount,
}: {
  paymentRequest: EncodedPaymentRequest
  amount: Satoshis
}): Promise<Satoshis | ApplicationError> => {
  const decodedInvoice = await decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (lnInvoiceAmount && lnInvoiceAmount > 0) {
    return new LnPaymentRequestZeroAmountRequiredError()
  }

  const paymentAmount = checkedToSats(amount)
  if (paymentAmount instanceof Error) return paymentAmount

  return feeProbe({ decodedInvoice, paymentAmount })
}

const feeProbe = async ({
  decodedInvoice,
  paymentAmount,
}: {
  decodedInvoice: LnInvoice
  paymentAmount: Satoshis
}): Promise<Satoshis | ApplicationError> => {
  const { destination, paymentHash, milliSatsAmount } = decodedInvoice

  const lndService = LndService()
  if (lndService instanceof Error) throw lndService
  if (lndService.isLocal(destination)) {
    return toSats(0)
  }

  const key = CachedRouteLookupKeyFactory().create({
    paymentHash,
    milliSats: milliSatsAmount,
  })
  const routeFromCache = await RoutesCache().findByKey(key)
  const validCachedRoute = !(routeFromCache instanceof Error)
  if (validCachedRoute) return toSats(routeFromCache.route.fee)

  const maxFee = LnFeeCalculator().max(paymentAmount)

  const rawRoute = await lndService.invoiceProbeForRoute({ decodedInvoice, maxFee })
  if (rawRoute instanceof RouteNotFoundError) return rawRoute
  if (rawRoute instanceof Error) return rawRoute

  const routeToCache = { pubkey: lndService.defaultPubkey(), route: rawRoute }
  const cachedRoute = await RoutesCache().store({ key, routeToCache })
  if (cachedRoute instanceof Error) return cachedRoute

  return toSats(rawRoute.fee)
}
