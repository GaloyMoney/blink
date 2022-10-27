// https://lightning.engineering/loopapi/index.html#service-swapclient
import util from "util"

import * as grpc from "@grpc/grpc-js"
import {
  SwapClientNotResponding,
  SwapServiceError,
  UnknownSwapServiceError,
  SwapErrorChannelBalanceTooLow,
} from "@domain/swap/errors"
import { SwapType as DomainSwapType } from "@domain/swap"
import { ServiceClient } from "@grpc/grpc-js/build/src/make-client"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"
import { BtcNetwork } from "@domain/bitcoin"

import { SwapState as DomainSwapState } from "@domain/swap/index"

import { WalletCurrency } from "@domain/shared"

import { SwapClientClient } from "./protos/loop_grpc_pb"
import {
  FailureReason,
  QuoteRequest,
  OutQuoteResponse,
  LoopOutRequest,
  SwapResponse,
  MonitorRequest,
  SwapState,
  SwapStatus,
  TokensResponse,
  TokensRequest,
  TermsRequest,
  OutTermsResponse,
} from "./protos/loop_pb"

export const LoopService = ({
  macaroon,
  tlsCert,
  grpcEndpoint,
  btcNetwork,
  lndInstanceName,
}: LoopdConfig): ISwapService => {
  const mac = Buffer.from(macaroon, "base64").toString("hex") as Macaroon
  const tls = Buffer.from(tlsCert, "base64")
  const swapClient: ServiceClient = createClient(mac, tls, grpcEndpoint)

  // helpers
  const clientHealthCheck = util.promisify<TokensRequest, TokensResponse>(
    swapClient.getLsatTokens.bind(swapClient),
  )
  const clientSwapOut = util.promisify<LoopOutRequest, SwapResponse>(
    swapClient.loopOut.bind(swapClient),
  )
  const clientSwapOutQuote = util.promisify<QuoteRequest, OutQuoteResponse>(
    swapClient.loopOutQuote.bind(swapClient),
  )
  const clientSwapOutTerms = util.promisify<TermsRequest, OutTermsResponse>(
    swapClient.loopOutTerms.bind(swapClient),
  )

  const healthCheck = async (): Promise<boolean> => {
    try {
      const request = new TokensRequest()
      const resp = await clientHealthCheck(request)
      if (resp) return true
    } catch (error) {
      return false
    }
    return false
  }

  const swapOut = async function ({
    amount,
    maxSwapFee,
    swapDestAddress,
  }: SwapOutArgs): Promise<SwapOutResult | SwapServiceError> {
    const fee = maxSwapFee ? Number(maxSwapFee.amount) : 20000
    try {
      const request = new LoopOutRequest()
      // on regtest, set the publication deadline to 0 for faster swaps, otherwise
      // set it to 30 minutes in the future to reduce swap fees
      const thirtyMins = 30 * 60 * 1000
      const swapPublicationDeadline =
        btcNetwork === BtcNetwork.regtest ? 0 : Date.now() + thirtyMins
      if (swapDestAddress) request.setDest(swapDestAddress)
      request.setAmt(Number(amount.amount))
      request.setMaxSwapFee(fee)
      request.setMaxPrepayRoutingFee(fee)
      request.setMaxSwapFee(fee)
      request.setMaxPrepayAmt(fee)
      request.setMaxMinerFee(fee)
      request.setSwapPublicationDeadline(swapPublicationDeadline)
      request.setInitiator(`galoy-${lndInstanceName}`)
      if (btcNetwork === BtcNetwork.regtest) request.setHtlcConfirmations(1)
      if (btcNetwork === BtcNetwork.regtest) request.setSweepConfTarget(2)
      const resp = await clientSwapOut(request)
      const swapOutResult: SwapOutResult = {
        htlcAddress: resp.getHtlcAddress() as OnChainAddress,
        serverMessage: resp.getServerMessage(),
        swapId: resp.getId() as SwapId,
        swapIdBytes: resp.getIdBytes().toString(),
      }
      return swapOutResult
    } catch (error) {
      if (error.message.includes("channel balance too low")) {
        return new SwapErrorChannelBalanceTooLow(error)
      }
      return new SwapServiceError(error)
    }
  }

  const swapListener = function (): SwapClientReadableStream<
    SwapListenerResponse | SwapServiceError
  > {
    try {
      const request = new MonitorRequest()
      const listener = swapClient.monitor(request)
      listener.on("data", (data: SwapStatus & SwapStatusResultWrapper) => {
        listener.pause()
        // parse data to our interface
        const state = parseState(data.getState())
        const message = parseMessage(data.getFailureReason())
        const swapType = parseSwapType(data.getType())
        const parsedSwapData: SwapStatusResult = {
          id: data.getId(),
          amt: BigInt(data.getAmt()),
          htlcAddress: data.getHtlcAddress(),
          offchainRoutingFee: BigInt(data.getCostOffchain()),
          onchainMinerFee: BigInt(data.getCostOnchain()),
          serviceProviderFee: BigInt(data.getCostServer()),
          state: state,
          message,
          swapType,
        }
        data.parsedSwapData = parsedSwapData
        listener.resume()
      })
      return listener
    } catch (error) {
      throw new UnknownSwapServiceError(error)
    }
  }

  const swapOutQuote = async (
    btcAmount: BtcPaymentAmount,
  ): Promise<SwapOutQuoteResult | SwapServiceError> => {
    try {
      const request = new QuoteRequest()
      request.setAmt(Number(btcAmount.amount))
      const resp = await clientSwapOutQuote(request)
      return {
        cltvDelta: resp.getCltvDelta(),
        confTarget: resp.getConfTarget(),
        htlcSweepFeeSat: {
          amount: BigInt(resp.getHtlcSweepFeeSat()),
          currency: WalletCurrency.Btc,
        },
        prepayAmtSat: {
          amount: BigInt(resp.getPrepayAmtSat()),
          currency: WalletCurrency.Btc,
        },
        swapFeeSat: {
          amount: BigInt(resp.getSwapFeeSat()),
          currency: WalletCurrency.Btc,
        },
        swapPaymentDest: resp.getSwapPaymentDest().toString() as OnChainAddress,
      }
    } catch (error) {
      return new UnknownSwapServiceError(error)
    }
  }

  const swapOutTerms = async (): Promise<SwapOutTermsResult | SwapServiceError> => {
    try {
      const request = new TermsRequest()
      const resp = await clientSwapOutTerms(request)
      return {
        maxCltvDelta: resp.getMaxCltvDelta(),
        maxSwapAmount: {
          amount: BigInt(resp.getMaxSwapAmount()),
          currency: WalletCurrency.Btc,
        },
        minCltvDelta: resp.getMinCltvDelta(),
        minSwapAmount: {
          amount: BigInt(resp.getMinSwapAmount()),
          currency: WalletCurrency.Btc,
        },
      }
    } catch (error) {
      return new UnknownSwapServiceError(error)
    }
  }

  function createClient(
    macaroon: Macaroon,
    tls: Buffer,
    grpcEndpoint: string,
  ): ServiceClient {
    const grpcOptions = {
      "grpc.max_receive_message_length": -1,
      "grpc.max_send_message_length": -1,
    }
    const sslCreds = grpc.credentials.createSsl(tls)
    const metadata = new grpc.Metadata()
    metadata.add("macaroon", macaroon)
    const macaroonCreds = grpc.credentials.createFromMetadataGenerator(
      (_args, callback) => {
        callback(null, metadata)
      },
    )
    const credentials = grpc.credentials.combineChannelCredentials(
      sslCreds,
      macaroonCreds,
    )
    try {
      const client: ServiceClient = new SwapClientClient(
        grpcEndpoint,
        credentials,
        grpcOptions,
      )
      return client
    } catch (e) {
      throw new SwapClientNotResponding(e)
    }
  }

  function parseState(state: number) {
    try {
      const parsedState = Object.keys(SwapState).find((key: string) => {
        // eslint-disable-next-line
        // @ts-ignore
        return SwapState[key] === state
      })
      if (parsedState === "INITIATED") return DomainSwapState.Initiated
      if (parsedState === "SUCCESS") return DomainSwapState.Success
      if (parsedState === "PREIMAGE_REVEALED") return DomainSwapState.PreimageRevealed
      if (parsedState === "HTLC_PUBLISHED") return DomainSwapState.HtlcPublished
      if (parsedState === "INVOICE_SETTLED") return DomainSwapState.Initiated
      return DomainSwapState.Failed
    } catch (e) {
      return DomainSwapState.Failed
    }
  }

  function parseMessage(messageCode: number): string {
    try {
      const parsedMessage = Object.keys(messageCode).find(
        // eslint-disable-next-line
        // @ts-ignore
        (key: string) => FailureReason[key] === messageCode,
      )
      return parsedMessage ?? ""
    } catch (e) {
      return ""
    }
  }

  function parseSwapType(swapType: number) {
    try {
      if (swapType === 0) return DomainSwapType.Swapout
      return DomainSwapType.Unknown
    } catch (e) {
      return DomainSwapType.Unknown
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.swap",
    fns: {
      healthCheck,
      swapOut,
      swapListener,
      swapOutQuote,
      swapOutTerms,
    },
  })
}
