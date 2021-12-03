import { getBalanceForWallet, walletIdFromPublicId } from "@app/wallets"
import { checkedToSats, toMilliSatsFromNumber, toSats } from "@domain/bitcoin"
import {
  decodeInvoice,
  LnFeeCalculator,
  RouteNotFoundError,
} from "@domain/bitcoin/lightning"
import {
  InsufficientBalanceError,
  LnPaymentRequestZeroAmountRequiredError,
  SatoshiAmountRequiredError,
} from "@domain/errors"
import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"
import { LndService } from "@services/lnd"
import { RoutesCache } from "@services/redis/routes"

export const getLightningFee = async ({
  walletPublicId,
  paymentRequest,
  logger,
}: {
  walletPublicId: WalletPublicId
  paymentRequest: EncodedPaymentRequest
  logger: Logger
}): Promise<Satoshis | ApplicationError> => {
  const decodedInvoice = await decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice
  const paymentAmount = checkedToSats(decodedInvoice.amount || 0)
  if (paymentAmount instanceof Error) return paymentAmount

  return feeProbe({ walletPublicId, decodedInvoice, paymentAmount, logger })
}

export const getNoAmountLightningFee = async ({
  walletPublicId,
  paymentRequest,
  amount,
  logger,
}: {
  walletPublicId: WalletPublicId
  paymentRequest: EncodedPaymentRequest
  amount: Satoshis
  logger: Logger
}): Promise<Satoshis | ApplicationError> => {
  const decodedInvoice = await decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (lnInvoiceAmount && lnInvoiceAmount > 0) {
    return new LnPaymentRequestZeroAmountRequiredError()
  }

  if (!(amount && amount > 0)) {
    return new SatoshiAmountRequiredError()
  }

  const paymentAmount = checkedToSats(amount)
  if (paymentAmount instanceof Error) return paymentAmount

  return noAmountProbeForFee({ walletPublicId, decodedInvoice, paymentAmount, logger })
}

const feeProbe = async ({
  walletPublicId,
  decodedInvoice,
  paymentAmount,
  logger,
}: {
  walletPublicId: WalletPublicId
  decodedInvoice: LnInvoice
  paymentAmount: Satoshis
  logger: Logger
}): Promise<Satoshis | ApplicationError> => {
  const { destination, paymentHash, milliSatsAmount } = decodedInvoice

  const walletId = await walletIdFromPublicId(walletPublicId)
  if (walletId instanceof Error) return walletId

  const balance = await getBalanceForWallet({ walletId, logger })
  if (balance instanceof Error) return balance
  if (balance < paymentAmount) {
    return new InsufficientBalanceError(
      `Payment amount '${paymentAmount}' exceeds balance '${balance}'`,
    )
  }

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
  if (rawRoute instanceof Error) return rawRoute

  const routeToCache = { pubkey: lndService.defaultPubkey(), route: rawRoute }
  const cachedRoute = await RoutesCache().store({ key, routeToCache })
  if (cachedRoute instanceof Error) return cachedRoute

  return toSats(rawRoute.fee)
}

const noAmountProbeForFee = async ({
  walletPublicId,
  decodedInvoice,
  paymentAmount,
  logger,
}: {
  walletPublicId: WalletPublicId
  decodedInvoice: LnInvoice
  paymentAmount: Satoshis
  logger: Logger
}): Promise<Satoshis | ApplicationError> => {
  const { destination, paymentHash } = decodedInvoice

  const walletId = await walletIdFromPublicId(walletPublicId)
  if (walletId instanceof Error) return walletId

  const balance = await getBalanceForWallet({ walletId, logger })
  if (balance instanceof Error) return balance
  if (balance < paymentAmount) {
    return new InsufficientBalanceError(
      `Payment amount '${paymentAmount}' exceeds balance '${balance}'`,
    )
  }

  const lndService = LndService()
  if (lndService instanceof Error) throw lndService
  if (lndService.isLocal(destination)) {
    return toSats(0)
  }

  const key = CachedRouteLookupKeyFactory().create({
    paymentHash,
    milliSats: toMilliSatsFromNumber(paymentAmount),
  })
  const routeFromCache = await RoutesCache().findByKey(key)
  const validCachedRoute = !(routeFromCache instanceof Error)
  if (validCachedRoute) return toSats(routeFromCache.route.fee)

  const maxFee = LnFeeCalculator().max(paymentAmount)

  const rawRoute = await lndService.noAmountInvoiceProbeForRoute({
    decodedInvoice,
    maxFee,
    amount: paymentAmount,
  })
  if (rawRoute instanceof RouteNotFoundError) return rawRoute
  if (rawRoute instanceof Error) return rawRoute

  const routeToCache = { pubkey: lndService.defaultPubkey(), route: rawRoute }
  const cachedRoute = await RoutesCache().store({ key, routeToCache })
  if (cachedRoute instanceof Error) return cachedRoute

  return toSats(rawRoute.fee)
}
