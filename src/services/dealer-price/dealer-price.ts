import util from "util"

import { getDealerPriceConfig } from "@config"

import { credentials } from "@grpc/grpc-js"

import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"

import {
  DealerStalePriceError,
  NoConnectionToDealerError,
  NoDealerPriceDataAvailableError,
  UnknownDealerPriceServiceError,
} from "@domain/dealer-price"

import { defaultTimeToExpiryInSeconds } from "@domain/bitcoin/lightning"

import { toWalletPriceRatio } from "@domain/payments"

import { wrapToAddAttributes } from "@services/tracing"

import { baseLogger } from "../logger"

import { PriceServiceClient } from "./proto/services/price/v1/price_service_grpc_pb"
import {
  GetCentsFromSatsForImmediateBuyRequest,
  GetCentsFromSatsForImmediateBuyResponse,
  GetCentsFromSatsForImmediateSellRequest,
  GetCentsFromSatsForImmediateSellResponse,
  GetCentsFromSatsForFutureBuyRequest,
  GetCentsFromSatsForFutureBuyResponse,
  GetCentsFromSatsForFutureSellRequest,
  GetCentsFromSatsForFutureSellResponse,
  GetSatsFromCentsForImmediateBuyRequest,
  GetSatsFromCentsForImmediateBuyResponse,
  GetSatsFromCentsForImmediateSellRequest,
  GetSatsFromCentsForImmediateSellResponse,
  GetSatsFromCentsForFutureBuyRequest,
  GetSatsFromCentsForFutureBuyResponse,
  GetSatsFromCentsForFutureSellRequest,
  GetSatsFromCentsForFutureSellResponse,
  GetCentsPerSatsExchangeMidRateRequest,
  GetCentsPerSatsExchangeMidRateResponse,
} from "./proto/services/price/v1/price_service_pb"

const config = getDealerPriceConfig()
const client = new PriceServiceClient(
  `${config.host}:${config.port}`,
  credentials.createInsecure(),
)

const clientGetCentsFromSatsForImmediateBuy = util.promisify<
  GetCentsFromSatsForImmediateBuyRequest,
  GetCentsFromSatsForImmediateBuyResponse
>(client.getCentsFromSatsForImmediateBuy.bind(client))

const clientGetCentsFromSatsForImmediateSell = util.promisify<
  GetCentsFromSatsForImmediateSellRequest,
  GetCentsFromSatsForImmediateSellResponse
>(client.getCentsFromSatsForImmediateSell.bind(client))

const clientGetCentsFromSatsForFutureBuy = util.promisify<
  GetCentsFromSatsForFutureBuyRequest,
  GetCentsFromSatsForFutureBuyResponse
>(client.getCentsFromSatsForFutureBuy.bind(client))

const clientGetCentsFromSatsForFutureSell = util.promisify<
  GetCentsFromSatsForFutureSellRequest,
  GetCentsFromSatsForFutureSellResponse
>(client.getCentsFromSatsForFutureSell.bind(client))

const clientGetSatsFromCentsForImmediateBuy = util.promisify<
  GetSatsFromCentsForImmediateBuyRequest,
  GetSatsFromCentsForImmediateBuyResponse
>(client.getSatsFromCentsForImmediateBuy.bind(client))

const clientGetSatsFromCentsForImmediateSell = util.promisify<
  GetSatsFromCentsForImmediateSellRequest,
  GetSatsFromCentsForImmediateSellResponse
>(client.getSatsFromCentsForImmediateSell.bind(client))

const clientGetSatsFromCentsForFutureBuy = util.promisify<
  GetSatsFromCentsForFutureBuyRequest,
  GetSatsFromCentsForFutureBuyResponse
>(client.getSatsFromCentsForFutureBuy.bind(client))

const clientGetSatsFromCentsForFutureSell = util.promisify<
  GetSatsFromCentsForFutureSellRequest,
  GetSatsFromCentsForFutureSellResponse
>(client.getSatsFromCentsForFutureSell.bind(client))

const clientGetCentsPerSatsExchangeMidRate = util.promisify<
  GetCentsPerSatsExchangeMidRateRequest,
  GetCentsPerSatsExchangeMidRateResponse
>(client.getCentsPerSatsExchangeMidRate.bind(client))

export const DealerPriceService = (
  timeToExpiryInSeconds: Seconds = defaultTimeToExpiryInSeconds,
): IDealerPriceService => {
  const getCentsFromSatsForImmediateBuy = async function (
    btcAmount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> {
    try {
      const response = await clientGetCentsFromSatsForImmediateBuy(
        new GetCentsFromSatsForImmediateBuyRequest().setAmountInSatoshis(
          Number(btcAmount.amount),
        ),
      )
      const amount = response.getAmountInCents()
      return paymentAmountFromNumber({ amount, currency: WalletCurrency.Usd })
    } catch (error) {
      baseLogger.error({ error }, "GetCentsFromSatsForImmediateBuy unable to fetch price")
      return handleDealerErrors(error)
    }
  }

  const getCentsFromSatsForImmediateSell = async function (
    btcAmount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> {
    try {
      const response = await clientGetCentsFromSatsForImmediateSell(
        new GetCentsFromSatsForImmediateSellRequest().setAmountInSatoshis(
          Number(btcAmount.amount),
        ),
      )
      const amount = response.getAmountInCents()
      return paymentAmountFromNumber({ amount, currency: WalletCurrency.Usd })
    } catch (error) {
      baseLogger.error(
        { error },
        "GetCentsFromSatsForImmediateSell unable to fetch price",
      )
      return handleDealerErrors(error)
    }
  }

  const getCentsFromSatsForFutureBuy = async function (
    btcAmount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> {
    try {
      const response = await clientGetCentsFromSatsForFutureBuy(
        new GetCentsFromSatsForFutureBuyRequest()
          .setAmountInSatoshis(Number(btcAmount.amount))
          .setTimeInSeconds(timeToExpiryInSeconds),
      )
      const amount = response.getAmountInCents()
      return paymentAmountFromNumber({ amount, currency: WalletCurrency.Usd })
    } catch (error) {
      baseLogger.error({ error }, "GetCentsFromSatsForFutureBuy unable to fetch price")
      return handleDealerErrors(error)
    }
  }

  const getCentsFromSatsForFutureSell = async function (
    btcAmount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> {
    try {
      const response = await clientGetCentsFromSatsForFutureSell(
        new GetCentsFromSatsForFutureSellRequest()
          .setAmountInSatoshis(Number(btcAmount.amount))
          .setTimeInSeconds(timeToExpiryInSeconds),
      )
      const amount = response.getAmountInCents()
      return paymentAmountFromNumber({ amount, currency: WalletCurrency.Usd })
    } catch (error) {
      baseLogger.error({ error }, "GetCentsFromSatsForFutureSell unable to fetch price")
      return handleDealerErrors(error)
    }
  }

  const getSatsFromCentsForImmediateBuy = async function (
    usdAmount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> {
    try {
      const response = await clientGetSatsFromCentsForImmediateBuy(
        new GetSatsFromCentsForImmediateBuyRequest().setAmountInCents(
          Number(usdAmount.amount),
        ),
      )
      const amount = response.getAmountInSatoshis()
      return paymentAmountFromNumber({ amount, currency: WalletCurrency.Btc })
    } catch (error) {
      baseLogger.error({ error }, "GetSatsFromCentsForImmediateBuy unable to fetch price")
      return handleDealerErrors(error)
    }
  }

  const getSatsFromCentsForImmediateSell = async function (
    usdAmount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> {
    try {
      const response = await clientGetSatsFromCentsForImmediateSell(
        new GetSatsFromCentsForImmediateSellRequest().setAmountInCents(
          Number(usdAmount.amount),
        ),
      )
      const amount = response.getAmountInSatoshis()
      return paymentAmountFromNumber({ amount, currency: WalletCurrency.Btc })
    } catch (error) {
      baseLogger.error(
        { error },
        "GetSatsFromCentsForImmediateSell unable to fetch price",
      )
      return handleDealerErrors(error)
    }
  }

  const getSatsFromCentsForFutureBuy = async function (
    usdAmount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> {
    try {
      const response = await clientGetSatsFromCentsForFutureBuy(
        new GetSatsFromCentsForFutureBuyRequest()
          .setAmountInCents(Number(usdAmount.amount))
          .setTimeInSeconds(timeToExpiryInSeconds),
      )
      const amount = response.getAmountInSatoshis()
      return paymentAmountFromNumber({ amount, currency: WalletCurrency.Btc })
    } catch (error) {
      baseLogger.error({ error }, "GetSatsFromCentsForFutureBuy unable to fetch price")
      return handleDealerErrors(error)
    }
  }

  const getSatsFromCentsForFutureSell = async function (
    usdAmount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> {
    try {
      const response = await clientGetSatsFromCentsForFutureSell(
        new GetSatsFromCentsForFutureSellRequest()
          .setAmountInCents(Number(usdAmount.amount))
          .setTimeInSeconds(timeToExpiryInSeconds),
      )
      const amount = response.getAmountInSatoshis()
      return paymentAmountFromNumber({ amount, currency: WalletCurrency.Btc })
    } catch (error) {
      baseLogger.error({ error }, "GetSatsFromCentsForFutureSell unable to fetch price")
      return handleDealerErrors(error)
    }
  }

  const getCentsPerSatsExchangeMidRate = async function (): Promise<
    WalletPriceRatio | ValidationError
  > {
    try {
      const response = await clientGetCentsPerSatsExchangeMidRate(
        new GetCentsPerSatsExchangeMidRateRequest(),
      )
      return toWalletPriceRatio(response.getRatioInCentsPerSatoshis())
    } catch (error) {
      baseLogger.error({ error }, "GetCentsPerSatsExchangeMidRate unable to fetch price")
      return handleDealerErrors(error)
    }
  }

  return wrapToAddAttributes({
    attributes: { ["slo.dealerCalled"]: "true" },
    fns: {
      getCentsFromSatsForImmediateBuy,
      getCentsFromSatsForImmediateSell,

      getCentsFromSatsForFutureBuy,
      getCentsFromSatsForFutureSell,

      getSatsFromCentsForImmediateBuy,
      getSatsFromCentsForImmediateSell,

      getSatsFromCentsForFutureBuy,
      getSatsFromCentsForFutureSell,

      getCentsPerSatsExchangeMidRate,
    },
  })
}

const handleDealerErrors = (err: Error | string) => {
  const errMsg = typeof err === "string" ? err : err.message

  const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errMsg)

  switch (true) {
    case match(KnownDealerErrorDetails.NoConnection):
      return new NoConnectionToDealerError(errMsg)

    case match(KnownDealerErrorDetails.StalePrice):
      return new DealerStalePriceError(errMsg)

    case match(KnownDealerErrorDetails.NoPriceData):
      return new NoDealerPriceDataAvailableError(errMsg)

    default:
      return new UnknownDealerPriceServiceError(errMsg)
  }
}

export const KnownDealerErrorDetails = {
  NoConnection: /No connection established/,
  StalePrice: /StalePrice/,
  NoPriceData: /No price data available/,
} as const
