import {
  checkedToCurrencyBaseAmount,
  checkedToSats,
  toMilliSatsFromNumber,
  toSats,
} from "@domain/bitcoin"
import { decodeInvoice, LnFeeCalculator } from "@domain/bitcoin/lightning"
import { InsufficientBalanceError, InvalidSatoshiAmountError } from "@domain/errors"
import { LnPaymentRequestZeroAmountRequiredError } from "@domain/payments"

import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"
import { checkedToWalletId } from "@domain/wallets"
import { WalletCurrency } from "@domain/shared"
import { LndService } from "@services/lnd"
import { LedgerService } from "@services/ledger"
import { RoutesCache } from "@services/redis/routes"
import { WalletsRepository } from "@services/mongoose"
import { DealerPriceService } from "@services/dealer-price"
import { toCents } from "@domain/fiat"

export const getRoutingFee = async ({
  walletId,
  paymentRequest,
  walletCurrency,
}: {
  walletId: WalletId
  paymentRequest: EncodedPaymentRequest
  walletCurrency: WalletCurrency
}): Promise<Satoshis | ApplicationError> => {
  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const amount = decodedInvoice.amount
  if (amount === null) {
    return new InvalidSatoshiAmountError()
  }

  const paymentAmount = checkedToSats(amount)
  if (paymentAmount instanceof Error) return paymentAmount

  return feeProbe({ walletId, decodedInvoice, paymentAmount, walletCurrency })
}

export const getNoAmountLightningFee = async ({
  walletId,
  paymentRequest,
  amount,
}: {
  walletId: string
  paymentRequest: EncodedPaymentRequest
  amount: number
}): Promise<Satoshis | ApplicationError> => {
  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (lnInvoiceAmount && lnInvoiceAmount > 0) {
    return new LnPaymentRequestZeroAmountRequiredError()
  }

  const paymentAmount = checkedToCurrencyBaseAmount(amount)
  if (paymentAmount instanceof Error) return paymentAmount

  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  // FIXME inefficient to pass WalletId and walletCurrency when Wallet is loaded
  const wallet = await WalletsRepository().findById(walletIdChecked)
  if (wallet instanceof Error) return wallet

  return noAmountProbeForFee({
    walletId: walletIdChecked,
    walletCurrency: wallet.currency,
    decodedInvoice,
    paymentAmount,
  })
}

const feeProbe = async ({
  walletId,
  decodedInvoice,
  paymentAmount,
  walletCurrency,
}: {
  walletId: WalletId
  decodedInvoice: LnInvoice
  paymentAmount: Satoshis
  walletCurrency: WalletCurrency
}): Promise<Satoshis | ApplicationError> => {
  const { destination, paymentHash } = decodedInvoice

  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const balance = await LedgerService().getWalletBalance(walletId)
  if (balance instanceof Error) return balance

  let balanceInSats: Satoshis
  if (walletCurrency === WalletCurrency.Usd) {
    const dealer = DealerPriceService()

    // FIXME: this is to get around a serialization problem for long floats and the grpc interface
    const roundedBalance = Math.floor(balance)
    const sats_ = await dealer.getSatsFromCentsForImmediateSell(toCents(roundedBalance))

    if (sats_ instanceof Error) return sats_
    balanceInSats = sats_
  } else {
    balanceInSats = balance as Satoshis
  }

  if (balanceInSats < paymentAmount) {
    return new InsufficientBalanceError(
      `Payment amount '${paymentAmount}' exceeds balance '${balance}'`,
    )
  }

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  if (lndService.isLocal(destination)) {
    return toSats(0)
  }

  const key = CachedRouteLookupKeyFactory().createFromMilliSats({
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
  walletCurrency,
  decodedInvoice,
  paymentAmount,
}: {
  walletId: WalletId
  walletCurrency: WalletCurrency
  decodedInvoice: LnInvoice
  paymentAmount: CurrencyBaseAmount
}): Promise<Satoshis | ApplicationError> => {
  const { destination, paymentHash } = decodedInvoice

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
    return toSats(0)
  }

  let sats: Satoshis
  let key: CachedRouteLookupKey

  if (walletCurrency === WalletCurrency.Usd) {
    const dealer = DealerPriceService()
    // TODO: maybe this should be Future sell here
    const sats_ = await dealer.getSatsFromCentsForImmediateSell(toCents(paymentAmount))
    if (sats_ instanceof Error) return sats_
    sats = sats_

    key = CachedRouteLookupKeyFactory().createFromCents({
      paymentHash,
      cents: toCents(paymentAmount),
    })
  } else {
    sats = toSats(paymentAmount)

    key = CachedRouteLookupKeyFactory().createFromMilliSats({
      paymentHash,
      milliSats: toMilliSatsFromNumber(sats * 1000),
    })
  }

  const routeFromCache = await RoutesCache().findByKey(key)
  const validCachedRoute = !(routeFromCache instanceof Error)
  if (validCachedRoute) return toSats(routeFromCache.route.fee)

  const maxFee = LnFeeCalculator().max(sats)

  const rawRoute = await lndService.findRouteForNoAmountInvoice({
    decodedInvoice,
    maxFee,
    amount: sats,
  })
  if (rawRoute instanceof Error) return rawRoute

  const routeToCache = { pubkey: lndService.defaultPubkey(), route: rawRoute }
  const cachedRoute = await RoutesCache().store({ key, routeToCache })
  if (cachedRoute instanceof Error) return cachedRoute

  return toSats(rawRoute.fee) // TODO: should return UsdCents for UsdWallet
}
