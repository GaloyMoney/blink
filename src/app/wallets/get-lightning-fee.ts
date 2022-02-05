import { checkedToSats, toMilliSatsFromBigInt, toSats } from "@domain/bitcoin"
import { decodeInvoice, LnFeeCalculator } from "@domain/bitcoin/lightning"
import {
  InsufficientBalanceError,
  InvalidSatoshiAmount,
  LnPaymentRequestZeroAmountRequiredError,
} from "@domain/errors"
import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"
import { checkedToWalletId } from "@domain/wallets"
import { LndService } from "@services/lnd"
import { LedgerService } from "@services/ledger"
import { RoutesCache } from "@services/redis/routes"

export const getRoutingFee = async ({
  walletId,
  paymentRequest,
}: {
  walletId: WalletId
  paymentRequest: EncodedPaymentRequest
}): Promise<Satoshis | ApplicationError> => {
  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  if (!decodedInvoice.amount) return new InvalidSatoshiAmount()

  // FIXME: going back to Number is inefficient. add checkToSats from bigint
  const paymentAmount = checkedToSats(Number(decodedInvoice.amount))
  if (paymentAmount instanceof Error) return paymentAmount

  return feeProbe({ walletId, decodedInvoice, paymentAmount })
}

export const getNoAmountLightningFee = async ({
  walletId,
  paymentRequest,
  amount,
}: {
  walletId: WalletId
  paymentRequest: EncodedPaymentRequest
  amount: number
}): Promise<Satoshis | ApplicationError> => {
  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (lnInvoiceAmount && lnInvoiceAmount > 0) {
    return new LnPaymentRequestZeroAmountRequiredError()
  }

  const paymentAmount = checkedToSats(amount)
  if (paymentAmount instanceof Error) return paymentAmount

  return noAmountProbeForFee({ walletId, decodedInvoice, paymentAmount })
}

const feeProbe = async ({
  walletId,
  decodedInvoice,
  paymentAmount,
}: {
  walletId: WalletId
  decodedInvoice: LnInvoice
  paymentAmount: Satoshis
}): Promise<Satoshis | ApplicationError> => {
  const { destination, paymentHash } = decodedInvoice

  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const balance = await LedgerService().getWalletBalance(walletId)
  if (balance instanceof Error) return balance
  if (balance < paymentAmount) {
    return new InsufficientBalanceError(
      `Payment amount '${paymentAmount}' exceeds balance '${balance}'`,
    )
  }

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  if (lndService.isLocal(destination)) {
    return toSats(0n)
  }

  const key = CachedRouteLookupKeyFactory().create({
    paymentHash,
    milliSats: toMilliSatsFromBigInt(paymentAmount * 1000n),
  })
  const routeFromCache = await RoutesCache().findByKey(key)
  const validCachedRoute = !(routeFromCache instanceof Error)
  if (validCachedRoute) return toSats(BigInt(routeFromCache.route.safe_fee))

  const maxFee = LnFeeCalculator().max(paymentAmount)

  const rawRoute = await lndService.findRouteForInvoice({ decodedInvoice, maxFee })
  if (rawRoute instanceof Error) return rawRoute

  const routeToCache = { pubkey: lndService.defaultPubkey(), route: rawRoute }
  const cachedRoute = await RoutesCache().store({ key, routeToCache })
  if (cachedRoute instanceof Error) return cachedRoute

  return toSats(BigInt(rawRoute.safe_fee))
}

const noAmountProbeForFee = async ({
  walletId,
  decodedInvoice,
  paymentAmount,
}: {
  walletId: WalletId
  decodedInvoice: LnInvoice
  paymentAmount: Satoshis
}): Promise<Satoshis | ApplicationError> => {
  const { destination, paymentHash } = decodedInvoice

  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const balance = await LedgerService().getWalletBalance(walletId)
  if (balance instanceof Error) return balance
  if (balance < paymentAmount) {
    return new InsufficientBalanceError(
      `Payment amount '${paymentAmount}' exceeds balance '${balance}'`,
    )
  }

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  if (lndService.isLocal(destination)) {
    return toSats(0n)
  }

  const key = CachedRouteLookupKeyFactory().create({
    paymentHash,
    milliSats: toMilliSatsFromBigInt(paymentAmount * 1000n),
  })
  const routeFromCache = await RoutesCache().findByKey(key)
  const validCachedRoute = !(routeFromCache instanceof Error)
  if (validCachedRoute) return toSats(BigInt(routeFromCache.route.safe_fee))

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

  return toSats(BigInt(rawRoute.safe_fee))
}
