import util from "util"

import { credentials } from "@grpc/grpc-js"

import { UnknownDealerPriceServiceError } from "@domain/dealer-price"

import { baseLogger } from "../logger"

import { PriceServiceClient } from "./proto/services/price/v1/price_service_grpc_pb"
import {
  GetExchangeRateForImmediateUsdBuyRequest,
  GetExchangeRateForImmediateUsdBuyResponse,
  GetExchangeRateForImmediateUsdSellRequest,
  GetExchangeRateForImmediateUsdSellResponse,
  GetExchangeRateForFutureUsdBuyRequest,
  GetExchangeRateForFutureUsdBuyResponse,
  GetExchangeRateForFutureUsdSellRequest,
  GetExchangeRateForFutureUsdSellResponse,
} from "./proto/services/price/v1/price_service_pb"

const serverPort = process.env.PRICE_SERVER_PORT ?? "50055"
const client = new PriceServiceClient(
  `localhost:${serverPort}`,
  credentials.createInsecure(),
)

const clientGetExchangeRateForImmediateUsdBuy = util.promisify(
  client.getExchangeRateForImmediateUsdBuy.bind(client),
)
const clientGetExchangeRateForImmediateUsdSell = util.promisify(
  client.getExchangeRateForImmediateUsdSell.bind(client),
)
const clientGetExchangeRateForFutureUsdBuy = util.promisify(
  client.getExchangeRateForFutureUsdBuy.bind(client),
)
const clientGetExchangeRateForFutureUsdSell = util.promisify(
  client.getExchangeRateForFutureUsdSell.bind(client),
)

export const DealerPriceService = (): IDealerPriceService => {
  const getExchangeRateForImmediateUsdBuy = async function (
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError> {
    try {
      const response = (await clientGetExchangeRateForImmediateUsdBuy(
        new GetExchangeRateForImmediateUsdBuyRequest().setAmountInSatoshis(
          amountInSatoshis,
        ),
      )) as GetExchangeRateForImmediateUsdBuyResponse
      return response.getPriceInUsd() as UsdCents
    } catch (error) {
      baseLogger.error(
        { error },
        "GetExchangeRateForImmediateUsdBuy unable to fetch price",
      )
      return new UnknownDealerPriceServiceError()
    }
  }

  const getExchangeRateForImmediateUsdSell = async function (
    amountInUsd: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError> {
    try {
      const response = (await clientGetExchangeRateForImmediateUsdSell(
        new GetExchangeRateForImmediateUsdSellRequest().setAmountInUsd(amountInUsd),
      )) as GetExchangeRateForImmediateUsdSellResponse
      return response.getPriceInSatoshis() as Satoshis
    } catch (error) {
      baseLogger.error(
        { error },
        "GetExchangeRateForImmediateUsdSell unable to fetch price",
      )
      return new UnknownDealerPriceServiceError()
    }
  }

  const getExchangeRateForFutureUsdBuy = async function (
    amountInSatoshis: Satoshis,
    timeToExpiryInMinutes: Minutes,
  ): Promise<UsdCents | DealerPriceServiceError> {
    try {
      const response = (await clientGetExchangeRateForFutureUsdBuy(
        new GetExchangeRateForFutureUsdBuyRequest()
          .setAmountInSatoshis(amountInSatoshis)
          .setTimeInMinutes(timeToExpiryInMinutes),
      )) as GetExchangeRateForFutureUsdBuyResponse
      return response.getPriceInUsd() as UsdCents
    } catch (error) {
      baseLogger.error({ error }, "GetExchangeRateForFutureUsdBuy unable to fetch price")
      return new UnknownDealerPriceServiceError()
    }
  }
  const getExchangeRateForFutureUsdSell = async function (
    amountInUsd: UsdCents,
    timeToExpiryInMinutes: Minutes,
  ): Promise<Satoshis | DealerPriceServiceError> {
    try {
      const response = (await clientGetExchangeRateForFutureUsdSell(
        new GetExchangeRateForFutureUsdSellRequest()
          .setAmountInUsd(amountInUsd)
          .setTimeInMinutes(timeToExpiryInMinutes),
      )) as GetExchangeRateForFutureUsdSellResponse
      return response.getPriceInSatoshis() as Satoshis
    } catch (error) {
      baseLogger.error({ error }, "GetExchangeRateForFutureUsdSell unable to fetch price")
      return new UnknownDealerPriceServiceError()
    }
  }

  return {
    getExchangeRateForImmediateUsdBuy,
    getExchangeRateForImmediateUsdSell,
    getExchangeRateForFutureUsdBuy,
    getExchangeRateForFutureUsdSell,
  }
}
