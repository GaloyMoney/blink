// https://lightning.engineering/loopapi/index.html#service-swapclient
import util from "util"

import * as grpc from "@grpc/grpc-js"
import { SwapClientNotResponding, SwapServiceError } from "@domain/swap/errors"
import { SwapState as SwapStateType } from "@domain/swap/index"
import { SwapType as DomainSwapType } from "@domain/swap"
import { ServiceClient } from "@grpc/grpc-js/build/src/make-client"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"
import { BtcNetwork } from "@domain/bitcoin"

import { SwapClientClient } from "./protos/loop_grpc_pb"
import {
  FailureReason,
  QuoteRequest,
  OutQuoteResponse,
  LoopOutRequest,
  SwapResponse,
  MonitorRequest,
  SwapState,
  SwapType,
  SwapStatus,
} from "./protos/loop_pb"

export const LoopService = ({
  macaroon,
  tlsCert,
  grpcEndpoint,
  btcNetwork,
  loopdInstanceName,
}: LoopdConfig): ISwapService => {
  const mac = Buffer.from(macaroon, "base64").toString("hex")
  const tls = Buffer.from(tlsCert, "base64")
  const swapClient: ServiceClient = createClient(mac, tls, grpcEndpoint)

  const clientHealthCheck = util.promisify<QuoteRequest, OutQuoteResponse>(
    swapClient.loopOutQuote.bind(swapClient),
  )
  const clientSwapOut = util.promisify<LoopOutRequest, SwapResponse>(
    swapClient.loopOut.bind(swapClient),
  )

  const healthCheck = async (): Promise<boolean | SwapServiceError> => {
    try {
      const request = new QuoteRequest()
      request.setAmt(500000)
      const resp = await clientHealthCheck(request)
      const fee = resp.getSwapFeeSat()
      if (fee) return true
    } catch (error) {
      return new SwapServiceError(error)
    }
    return false
  }

  const swapOut = async function ({
    amount,
    maxSwapFee,
    swapDestAddress,
  }: SwapOutArgs): Promise<SwapOutResult | SwapServiceError> {
    const fee = maxSwapFee ? maxSwapFee : 20000
    try {
      const request = new LoopOutRequest()
      // on regtest, set the publication deadline to 0 for faster swaps, otherwise
      // set it to 30 minutes in the future to reduce swap fees
      const thirtyMins = 30 * 60 * 1000
      const swapPublicationDeadline =
        btcNetwork === BtcNetwork.regtest ? 0 : Date.now() + thirtyMins
      if (swapDestAddress) request.setDest(swapDestAddress)
      request.setAmt(amount)
      request.setMaxSwapFee(fee)
      request.setMaxPrepayRoutingFee(fee)
      request.setMaxSwapFee(fee)
      request.setMaxPrepayAmt(fee)
      request.setMaxMinerFee(fee)
      request.setSwapPublicationDeadline(swapPublicationDeadline)
      request.setInitiator(`galoy-${loopdInstanceName}`)
      const resp = await clientSwapOut(request)
      const swapOutResult: SwapOutResult = {
        htlcAddress: resp.getHtlcAddress(),
        serverMessage: resp.getServerMessage(),
        swapId: resp.getId(),
        swapIdBytes: resp.getIdBytes().toString(),
      }
      return swapOutResult
    } catch (error) {
      return new SwapServiceError(error)
    }
  }

  const swapListener = function (): SwapClientReadableStream<SwapListenerResponse> {
    try {
      const request = new MonitorRequest()
      const listener = swapClient.monitor(request)
      // listener.on("data" | "status" | "end")
      listener.on("data", (data: SwapStatus & SwapStatusResultWrapper) => {
        listener.pause()
        // parse data to our interface
        const stateVal = data.getState()
        let state
        try {
          state = Object.keys(SwapState).find((key) => {
            // eslint-disable-next-line
            // @ts-ignore
            return SwapState[key] === stateVal
          })
        } catch (e) {
          state = SwapState.FAILED
        }
        let message
        try {
          const failureReason = data.getFailureReason()
          message = Object.keys(FailureReason).find(
            // eslint-disable-next-line
            // @ts-ignore
            (key) => FailureReason[key] === failureReason,
          )
        } catch (e) {
          message = ""
        }
        let swapType = DomainSwapType.SWAP_OUT
        try {
          const dataType = data.getType()
          const parsedType = Object.keys(SwapType).find(
            // eslint-disable-next-line
            // @ts-ignore
            (key) => SwapType[key] === dataType,
          )
          if (parsedType) {
            if (parsedType === "LOOP_OUT") {
              swapType = DomainSwapType.SWAP_OUT
            }
          }
        } catch (e) {
          swapType = DomainSwapType.SWAP_OUT
        }
        const parsedSwapData: SwapStatusResult = {
          id: data.getId(),
          amt: BigInt(data.getAmt()),
          htlcAddress: data.getHtlcAddress(),
          offchainRoutingFee: BigInt(data.getCostOffchain()),
          onchainMinerFee: BigInt(data.getCostOnchain()),
          serviceProviderFee: BigInt(data.getCostServer()),
          state: state as SwapStateType,
          message: message ? message : "",
          swapType,
        }
        data.parsedSwapData = parsedSwapData
        listener.resume()
      })
      return listener
    } catch (error) {
      throw new SwapServiceError(error)
    }
  }

  function createClient(
    macaroon: string,
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
      throw SwapClientNotResponding
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.swap",
    fns: {
      healthCheck,
      swapOut,
      swapListener,
    },
  })
}
