import util from "util"

import { credentials } from "@grpc/grpc-js"

import { UnknownDealerPriceServiceError } from "@domain/dealer-price"

import { toSats } from "@domain/bitcoin"

import { baseLogger } from "../logger"

import { PriceServiceClient } from "./proto/services/price/v1/price_service_grpc_pb"
import {
  GetExchangeRateForImmediateUsdBuyRequest,
  GetExchangeRateForImmediateUsdBuyResponse,
  GetExchangeRateForImmediateUsdBuyFromCentsRequest,
  GetExchangeRateForImmediateUsdBuyFromCentsResponse,
  GetExchangeRateForImmediateUsdSellRequest,
  GetExchangeRateForImmediateUsdSellResponse,
  GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
  GetExchangeRateForImmediateUsdSellFromSatoshisResponse,
  GetQuoteRateForFutureUsdBuyRequest,
  GetQuoteRateForFutureUsdBuyResponse,
  GetQuoteRateForFutureUsdSellRequest,
  GetQuoteRateForFutureUsdSellResponse,
} from "./proto/services/price/v1/price_service_pb"

const serverPort = process.env.PRICE_SERVER_PORT ?? "50055"
const client = new PriceServiceClient(
  `localhost:${serverPort}`,
  credentials.createInsecure(),
)

const clientGetExchangeRateForImmediateUsdBuy = util.promisify<
  GetExchangeRateForImmediateUsdBuyRequest,
  GetExchangeRateForImmediateUsdBuyResponse
>(client.getExchangeRateForImmediateUsdBuy.bind(client))

const clientGetExchangeRateForImmediateUsdBuyFromCents = util.promisify<
  GetExchangeRateForImmediateUsdBuyFromCentsRequest,
  GetExchangeRateForImmediateUsdBuyFromCentsResponse
>(client.getExchangeRateForImmediateUsdBuyFromCents.bind(client))

const clientGetExchangeRateForImmediateUsdSell = util.promisify<
  GetExchangeRateForImmediateUsdSellRequest,
  GetExchangeRateForImmediateUsdSellResponse
>(client.getExchangeRateForImmediateUsdSell.bind(client))

const clientGetExchangeRateForImmediateUsdSellFromSatoshis = util.promisify<
  GetExchangeRateForImmediateUsdSellFromSatoshisRequest,
  GetExchangeRateForImmediateUsdSellFromSatoshisResponse
>(client.getExchangeRateForImmediateUsdSellFromSatoshis.bind(client))

const clientGetQuoteRateForFutureUsdBuy = util.promisify<
  GetQuoteRateForFutureUsdBuyRequest,
  GetQuoteRateForFutureUsdBuyResponse
>(client.getQuoteRateForFutureUsdBuy.bind(client))

const clientGetQuoteRateForFutureUsdSell = util.promisify<
  GetQuoteRateForFutureUsdSellRequest,
  GetQuoteRateForFutureUsdSellResponse
>(client.getQuoteRateForFutureUsdSell.bind(client))

export const DealerPriceService = (): IDealerPriceService => {
  const getExchangeRateForImmediateUsdBuy = async function (
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError> {
    try {
      const response = await clientGetExchangeRateForImmediateUsdBuy(
        new GetExchangeRateForImmediateUsdBuyRequest().setAmountInSatoshis(
          amountInSatoshis,
        ),
      )
      return response.getAmountInUsd() as UsdCents
    } catch (error) {
      baseLogger.error(
        { error },
        "GetExchangeRateForImmediateUsdBuy unable to fetch price",
      )
      return new UnknownDealerPriceServiceError(error)
    }
  }

  const getExchangeRateForImmediateUsdBuyFromCents = async function (
    amountInUsd: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError> {
    try {
      const response = await clientGetExchangeRateForImmediateUsdBuyFromCents(
        new GetExchangeRateForImmediateUsdBuyFromCentsRequest().setAmountInCents(
          amountInUsd,
        ),
      )
      return toSats(response.getAmountInSatoshis())
    } catch (error) {
      baseLogger.error(
        { error },
        "GetExchangeRateForImmediateUsdBuyFromCents unable to fetch price",
      )
      return new UnknownDealerPriceServiceError(error)
    }
  }

  const getExchangeRateForImmediateUsdSell = async function (
    amountInUsd: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError> {
    try {
      const response = await clientGetExchangeRateForImmediateUsdSell(
        new GetExchangeRateForImmediateUsdSellRequest().setAmountInUsd(amountInUsd),
      )
      return toSats(response.getAmountInSatoshis())
    } catch (error) {
      baseLogger.error(
        { error },
        "GetExchangeRateForImmediateUsdSell unable to fetch price",
      )
      return new UnknownDealerPriceServiceError(error)
    }
  }

  const getExchangeRateForImmediateUsdSellFromSatoshis = async function (
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError> {
    try {
      const response = await clientGetExchangeRateForImmediateUsdSellFromSatoshis(
        new GetExchangeRateForImmediateUsdSellFromSatoshisRequest().setAmountInSatoshis(
          amountInSatoshis,
        ),
      )
      return response.getAmountInUsd() as UsdCents
    } catch (error) {
      baseLogger.error(
        { error },
        "GetExchangeRateForImmediateUsdSellFromSatoshis unable to fetch price",
      )
      return new UnknownDealerPriceServiceError(error)
    }
  }

  const getQuoteRateForFutureUsdBuy = async function (
    amountInSatoshis: Satoshis,
    timeToExpiryInSeconds: Seconds,
  ): Promise<UsdCents | DealerPriceServiceError> {
    try {
      const response = await clientGetQuoteRateForFutureUsdBuy(
        new GetQuoteRateForFutureUsdBuyRequest()
          .setAmountInSatoshis(amountInSatoshis)
          .setTimeInSeconds(timeToExpiryInSeconds),
      )
      return response.getAmountInUsd() as UsdCents
    } catch (error) {
      baseLogger.error({ error }, "GetQuoteRateForFutureUsdBuy unable to fetch price")
      return new UnknownDealerPriceServiceError(error)
    }
  }
  const getQuoteRateForFutureUsdSell = async function (
    amountInUsd: UsdCents,
    timeToExpiryInSeconds: Seconds,
  ): Promise<Satoshis | DealerPriceServiceError> {
    try {
      const response = await clientGetQuoteRateForFutureUsdSell(
        new GetQuoteRateForFutureUsdSellRequest()
          .setAmountInUsd(amountInUsd)
          .setTimeInSeconds(timeToExpiryInSeconds),
      )
      return toSats(response.getAmountInSatoshis())
    } catch (error) {
      baseLogger.error({ error }, "GetQuoteRateForFutureUsdSell unable to fetch price")
      return new UnknownDealerPriceServiceError(error)
    }
  }

  return {
    getExchangeRateForImmediateUsdBuy,
    getExchangeRateForImmediateUsdBuyFromCents,
    getExchangeRateForImmediateUsdSell,
    getExchangeRateForImmediateUsdSellFromSatoshis,
    getQuoteRateForFutureUsdBuy,
    getQuoteRateForFutureUsdSell,
  }
}
