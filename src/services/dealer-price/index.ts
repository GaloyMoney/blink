import util from "util"

import { credentials } from "@grpc/grpc-js"

import { UnknownDealerPriceServiceError } from "@domain/dealer-price"

import { toSats } from "@domain/bitcoin"

import { toCents } from "@domain/fiat"

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
  GetCentsPerBtcExchangeMidRateRequest,
  GetCentsPerBtcExchangeMidRateResponse,
} from "./proto/services/price/v1/price_service_pb"

const serverPort = process.env.PRICE_SERVER_PORT ?? "50055"
const client = new PriceServiceClient(
  `localhost:${serverPort}`,
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

const clientGetCentsPerBtcExchangeMidRate = util.promisify<
  GetCentsPerBtcExchangeMidRateRequest,
  GetCentsPerBtcExchangeMidRateResponse
>(client.getCentsPerBtcExchangeMidRate.bind(client))

export const DealerPriceService = (): IDealerPriceService => {
  const getCentsFromSatsForImmediateBuy = async function (
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError> {
    try {
      const response = await clientGetCentsFromSatsForImmediateBuy(
        new GetCentsFromSatsForImmediateBuyRequest().setAmountInSatoshis(
          amountInSatoshis,
        ),
      )
      return toCents(response.getAmountInCents())
    } catch (error) {
      baseLogger.error({ error }, "GetCentsFromSatsForImmediateBuy unable to fetch price")
      return new UnknownDealerPriceServiceError(error.message)
    }
  }

  const getCentsFromSatsForImmediateSell = async function (
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError> {
    try {
      const response = await clientGetCentsFromSatsForImmediateSell(
        new GetCentsFromSatsForImmediateSellRequest().setAmountInSatoshis(
          amountInSatoshis,
        ),
      )
      return toCents(response.getAmountInCents())
    } catch (error) {
      baseLogger.error(
        { error },
        "GetCentsFromSatsForImmediateSell unable to fetch price",
      )
      return new UnknownDealerPriceServiceError(error.message)
    }
  }

  const getCentsFromSatsForFutureBuy = async function (
    amountInSatoshis: Satoshis,
    timeToExpiryInSeconds: Seconds,
  ): Promise<UsdCents | DealerPriceServiceError> {
    try {
      const response = await clientGetCentsFromSatsForFutureBuy(
        new GetCentsFromSatsForFutureBuyRequest()
          .setAmountInSatoshis(amountInSatoshis)
          .setTimeInSeconds(timeToExpiryInSeconds),
      )
      return toCents(response.getAmountInCents())
    } catch (error) {
      baseLogger.error({ error }, "GetCentsFromSatsForFutureBuy unable to fetch price")
      return new UnknownDealerPriceServiceError(error.message)
    }
  }

  const getCentsFromSatsForFutureSell = async function (
    amountInSatoshis: Satoshis,
    timeToExpiryInSeconds: Seconds,
  ): Promise<UsdCents | DealerPriceServiceError> {
    try {
      const response = await clientGetCentsFromSatsForFutureSell(
        new GetCentsFromSatsForFutureSellRequest()
          .setAmountInSatoshis(amountInSatoshis)
          .setTimeInSeconds(timeToExpiryInSeconds),
      )
      return toCents(response.getAmountInCents())
    } catch (error) {
      baseLogger.error({ error }, "GetCentsFromSatsForFutureSell unable to fetch price")
      return new UnknownDealerPriceServiceError(error.message)
    }
  }

  const getSatsFromCentsForImmediateBuy = async function (
    amountInCents: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError> {
    try {
      const response = await clientGetSatsFromCentsForImmediateBuy(
        new GetSatsFromCentsForImmediateBuyRequest().setAmountInCents(amountInCents),
      )
      return toSats(response.getAmountInSatoshis())
    } catch (error) {
      baseLogger.error({ error }, "GetSatsFromCentsForImmediateBuy unable to fetch price")
      return new UnknownDealerPriceServiceError(error.message)
    }
  }

  const getSatsFromCentsForImmediateSell = async function (
    amountInCents: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError> {
    try {
      const response = await clientGetSatsFromCentsForImmediateSell(
        new GetSatsFromCentsForImmediateSellRequest().setAmountInCents(amountInCents),
      )
      return toSats(response.getAmountInSatoshis())
    } catch (error) {
      baseLogger.error(
        { error },
        "GetSatsFromCentsForImmediateSell unable to fetch price",
      )
      return new UnknownDealerPriceServiceError(error.message)
    }
  }

  const getSatsFromCentsForFutureBuy = async function (
    amountInCents: UsdCents,
    timeToExpiryInSeconds: Seconds,
  ): Promise<Satoshis | DealerPriceServiceError> {
    try {
      const response = await clientGetSatsFromCentsForFutureBuy(
        new GetSatsFromCentsForFutureBuyRequest()
          .setAmountInCents(amountInCents)
          .setTimeInSeconds(timeToExpiryInSeconds),
      )
      return toSats(response.getAmountInSatoshis())
    } catch (error) {
      baseLogger.error({ error }, "GetSatsFromCentsForFutureBuy unable to fetch price")
      return new UnknownDealerPriceServiceError(error.message)
    }
  }

  const getSatsFromCentsForFutureSell = async function (
    amountInCents: UsdCents,
    timeToExpiryInSeconds: Seconds,
  ): Promise<Satoshis | DealerPriceServiceError> {
    try {
      const response = await clientGetSatsFromCentsForFutureSell(
        new GetSatsFromCentsForFutureSellRequest()
          .setAmountInCents(amountInCents)
          .setTimeInSeconds(timeToExpiryInSeconds),
      )
      return toSats(response.getAmountInSatoshis())
    } catch (error) {
      baseLogger.error({ error }, "GetSatsFromCentsForFutureSell unable to fetch price")
      return new UnknownDealerPriceServiceError(error.message)
    }
  }

  const getCentsPerBtcExchangeMidRate = async function (): Promise<
    UsdCents | DealerPriceServiceError
  > {
    try {
      const response = await clientGetCentsPerBtcExchangeMidRate(
        new GetCentsPerBtcExchangeMidRateRequest(),
      )
      return toCents(response.getAmountInCents())
    } catch (error) {
      baseLogger.error({ error }, "GetCentsPerBtcExchangeMidRate unable to fetch price")
      return new UnknownDealerPriceServiceError(error.message)
    }
  }

  return {
    getCentsFromSatsForImmediateBuy,
    getCentsFromSatsForImmediateSell,

    getCentsFromSatsForFutureBuy,
    getCentsFromSatsForFutureSell,

    getSatsFromCentsForImmediateBuy,
    getSatsFromCentsForImmediateSell,

    getSatsFromCentsForFutureBuy,
    getSatsFromCentsForFutureSell,

    getCentsPerBtcExchangeMidRate,
  }
}
