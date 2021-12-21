import { checkedToSats, toMilliSatsFromNumber, toSats } from "@domain/bitcoin"
import { decodeInvoice, LnFeeCalculator } from "@domain/bitcoin/lightning"
import {
  InsufficientBalanceError,
  LnPaymentRequestZeroAmountRequiredError,
} from "@domain/errors"
import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"
import { checkedToWalletId } from "@domain/wallets"
import { LndService } from "@services/lnd"
import { RoutesCache } from "@services/redis/routes"
import { getBalanceForWallet } from "./get-balance-for-wallet"

export const getLightningFee = async ({
  walletId,
  paymentRequest,
  logger,
}: {
  walletId: WalletId
  paymentRequest: EncodedPaymentRequest
  logger: Logger
}): Promise<Satoshis | ApplicationError> => {
  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice
  const paymentAmount = checkedToSats(decodedInvoice.amount || 0)
  if (paymentAmount instanceof Error) return paymentAmount

  return feeProbe({ walletId, decodedInvoice, paymentAmount, logger })
}

export const getNoAmountLightningFee = async ({
  walletId,
  paymentRequest,
  amount,
  logger,
}: {
  walletId: WalletId
  paymentRequest: EncodedPaymentRequest
  amount: Satoshis
  logger: Logger
}): Promise<Satoshis | ApplicationError> => {
  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (lnInvoiceAmount && lnInvoiceAmount > 0) {
    return new LnPaymentRequestZeroAmountRequiredError()
  }

  const paymentAmount = checkedToSats(amount)
  if (paymentAmount instanceof Error) return paymentAmount

  return noAmountProbeForFee({ walletId, decodedInvoice, paymentAmount, logger })
}

const feeProbe = async ({
  walletId,
  decodedInvoice,
  paymentAmount,
  logger,
}: {
  walletId: WalletId
  decodedInvoice: LnInvoice
  paymentAmount: Satoshis
  logger: Logger
}): Promise<Satoshis | ApplicationError> => {
  const { destination, paymentHash } = decodedInvoice

  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const balance = await getBalanceForWallet({ walletId, logger })
  if (balance instanceof Error) return balance
  if (balance < paymentAmount) {
    return new InsufficientBalanceError(
      `Payment amount '${paymentAmount}' exceeds balance '${balance}'`,
    )
  }

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  if (lndService.isLocal(destination)) {
    return toSats(0)
  }

  const key = CachedRouteLookupKeyFactory().create({
    paymentHash,
    milliSats: toMilliSatsFromNumber(paymentAmount * 1000),
  })
  const routeFromCache = await RoutesCache().findByKey(key)
  const validCachedRoute = !(routeFromCache instanceof Error)
  if (validCachedRoute) return toSats(routeFromCache.route.fee)

  const maxFee = LnFeeCalculator().max(paymentAmount)

  const rawRoute = await lndService.findRouteForInvoice({ decodedInvoice, maxFee })
  if (rawRoute instanceof Error) return rawRoute

  const routeToCache = { pubkey: lndService.defaultPubkey(), route: rawRoute }
  const cachedRoute = await RoutesCache().store({ key, routeToCache })
  if (cachedRoute instanceof Error) return cachedRoute

  return toSats(rawRoute.fee)
}

const noAmountProbeForFee = async ({
  walletId,
  decodedInvoice,
  paymentAmount,
  logger,
}: {
  walletId: WalletId
  decodedInvoice: LnInvoice
  paymentAmount: Satoshis
  logger: Logger
}): Promise<Satoshis | ApplicationError> => {
  const { destination, paymentHash } = decodedInvoice

  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const balance = await getBalanceForWallet({ walletId, logger })
  if (balance instanceof Error) return balance
  if (balance < paymentAmount) {
    return new InsufficientBalanceError(
      `Payment amount '${paymentAmount}' exceeds balance '${balance}'`,
    )
  }

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  if (lndService.isLocal(destination)) {
    return toSats(0)
  }

  const key = CachedRouteLookupKeyFactory().create({
    paymentHash,
    milliSats: toMilliSatsFromNumber(paymentAmount * 1000),
  })
  const routeFromCache = await RoutesCache().findByKey(key)
  const validCachedRoute = !(routeFromCache instanceof Error)
  if (validCachedRoute) return toSats(routeFromCache.route.fee)

  const maxFee = LnFeeCalculator().max(paymentAmount)

  const rawRoute = await lndService.findRouteForNoAmountInvoice({
    decodedInvoice,
    maxFee,
    amount: paymentAmount,
  })
  if (rawRoute instanceof Error) return rawRoute

  const routeToCache = { pubkey: lndService.defaultPubkey(), route: rawRoute }
  const cachedRoute = await RoutesCache().store({ key, routeToCache })
  if (cachedRoute instanceof Error) return cachedRoute

  return toSats(rawRoute.fee)
}
