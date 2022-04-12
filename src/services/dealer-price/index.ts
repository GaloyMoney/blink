import util from "util"

import { getDealerPriceConfig } from "@config"

import { credentials } from "@grpc/grpc-js"

import { WalletCurrency } from "@domain/shared"

import { UnknownDealerPriceServiceError } from "@domain/dealer-price"

import { toSats } from "@domain/bitcoin"
import { defaultTimeToExpiryInSeconds } from "@domain/bitcoin/lightning"

import { toCents, toCentsPerSatsRatio } from "@domain/fiat"

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

  const getCentsPerSatsExchangeMidRate = async function (): Promise<
    CentsPerSatsRatio | DealerPriceServiceError
  > {
    try {
      const response = await clientGetCentsPerSatsExchangeMidRate(
        new GetCentsPerSatsExchangeMidRateRequest(),
      )
      return toCentsPerSatsRatio(response.getRatioInCentsPerSatoshis())
    } catch (error) {
      baseLogger.error({ error }, "GetCentsPerSatsExchangeMidRate unable to fetch price")
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

    getCentsPerSatsExchangeMidRate,
  }
}

export const NewDealerPriceService = (
  timeToExpiryInSeconds: Seconds = defaultTimeToExpiryInSeconds,
): IDealerPriceServiceNew => {
  const getCentsFromSatsForImmediateBuy = async function (
    btcAmount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> {
    try {
      const response = await clientGetCentsFromSatsForImmediateBuy(
        new GetCentsFromSatsForImmediateBuyRequest().setAmountInSatoshis(
          Number(btcAmount.amount),
        ),
      )
      return {
        amount: BigInt(response.getAmountInCents()),
        currency: WalletCurrency.Usd,
      }
    } catch (error) {
      baseLogger.error({ error }, "GetCentsFromSatsForImmediateBuy unable to fetch price")
      return new UnknownDealerPriceServiceError(error.message)
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
      return {
        amount: BigInt(response.getAmountInCents()),
        currency: WalletCurrency.Usd,
      }
    } catch (error) {
      baseLogger.error(
        { error },
        "GetCentsFromSatsForImmediateSell unable to fetch price",
      )
      return new UnknownDealerPriceServiceError(error.message)
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
      return {
        amount: BigInt(response.getAmountInCents()),
        currency: WalletCurrency.Usd,
      }
    } catch (error) {
      baseLogger.error({ error }, "GetCentsFromSatsForFutureBuy unable to fetch price")
      return new UnknownDealerPriceServiceError(error.message)
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
      return {
        amount: BigInt(response.getAmountInCents()),
        currency: WalletCurrency.Usd,
      }
    } catch (error) {
      baseLogger.error({ error }, "GetCentsFromSatsForFutureSell unable to fetch price")
      return new UnknownDealerPriceServiceError(error.message)
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
      return {
        amount: BigInt(response.getAmountInSatoshis()),
        currency: WalletCurrency.Btc,
      }
    } catch (error) {
      baseLogger.error({ error }, "GetSatsFromCentsForImmediateBuy unable to fetch price")
      return new UnknownDealerPriceServiceError(error.message)
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
      return {
        amount: BigInt(response.getAmountInSatoshis()),
        currency: WalletCurrency.Btc,
      }
    } catch (error) {
      baseLogger.error(
        { error },
        "GetSatsFromCentsForImmediateSell unable to fetch price",
      )
      return new UnknownDealerPriceServiceError(error.message)
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
      return {
        amount: BigInt(response.getAmountInSatoshis()),
        currency: WalletCurrency.Btc,
      }
    } catch (error) {
      baseLogger.error({ error }, "GetSatsFromCentsForFutureBuy unable to fetch price")
      return new UnknownDealerPriceServiceError(error.message)
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
      return {
        amount: BigInt(response.getAmountInSatoshis()),
        currency: WalletCurrency.Btc,
      }
    } catch (error) {
      baseLogger.error({ error }, "GetSatsFromCentsForFutureSell unable to fetch price")
      return new UnknownDealerPriceServiceError(error.message)
    }
  }

  const getCentsPerSatsExchangeMidRate = async function (): Promise<
    CentsPerSatsRatio | DealerPriceServiceError
  > {
    try {
      const response = await clientGetCentsPerSatsExchangeMidRate(
        new GetCentsPerSatsExchangeMidRateRequest(),
      )
      return toCentsPerSatsRatio(response.getRatioInCentsPerSatoshis())
    } catch (error) {
      baseLogger.error({ error }, "GetCentsPerSatsExchangeMidRate unable to fetch price")
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

    getCentsPerSatsExchangeMidRate,
  }
}
