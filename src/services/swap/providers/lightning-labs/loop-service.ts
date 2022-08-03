// https://lightning.engineering/loopapi/index.html#service-swapclient
import util from "util"

import * as grpc from "@grpc/grpc-js"
import { getSwapConfig } from "@config"
import { SwapClientNotResponding, SwapServiceError } from "@domain/swap/errors"

import { SwapState as SwapStateType } from "@domain/swap/index"

import { SwapType as DomainSwapType } from "@domain/swap"

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

const loopMacaroon = process.env.LND1_LOOP_MACAROON
  ? Buffer.from(process.env.LND1_LOOP_MACAROON, "base64").toString("hex")
  : ""
const loopTls = Buffer.from(
  process.env.LND1_LOOP_TLS ? process.env.LND1_LOOP_TLS : "",
  "base64",
)
const loopUrl = getSwapConfig().lnd1loopRpcEndpoint

export const LoopService = ({
  macaroon,
  tlsCert,
  grpcEndpoint,
}: {
  macaroon?: string
  tlsCert?: string
  grpcEndpoint?: string
}) => {
  let swapClient
  if (macaroon && tlsCert && grpcEndpoint) {
    const mac = Buffer.from(macaroon, "base64").toString("hex")
    const tls = Buffer.from(tlsCert, "base64")
    swapClient = createClient(mac, tls, grpcEndpoint)
  } else {
    swapClient = createClient(loopMacaroon, loopTls, loopUrl)
  }

  const clientHealthCheck = util.promisify<QuoteRequest, OutQuoteResponse>(
    swapClient.loopOutQuote.bind(swapClient),
  )
  const clientSwapOut = util.promisify<LoopOutRequest, SwapResponse>(
    swapClient.loopOut.bind(swapClient),
  )

  const healthCheck = async (): Promise<boolean> => {
    try {
      const request = new QuoteRequest()
      request.setAmt(500000)
      const resp = await clientHealthCheck(request)
      const fee = resp.getSwapFeeSat()
      if (fee) return true
    } catch (error) {
      console.log(error)
    }
    return false
  }

  const swapOut = async function ({
    amount,
    maxSwapFee,
    swapDestAddress,
  }: {
    amount: Satoshis
    maxSwapFee?: Satoshis
    swapDestAddress?: string
  }): Promise<SwapOutResult | SwapServiceError> {
    const fee = maxSwapFee ? maxSwapFee : 20000
    try {
      const request = new LoopOutRequest()
      // if swap out does not occur in 2 hours (7200 sec) than it will fail
      const swapPublicationDeadline = 7200
      if (swapDestAddress) request.setDest(swapDestAddress)
      request.setAmt(amount)
      request.setMaxSwapFee(fee)
      request.setMaxPrepayRoutingFee(fee)
      request.setMaxSwapFee(fee)
      request.setMaxPrepayAmt(fee)
      request.setMaxMinerFee(fee)
      request.setSweepConfTarget(2)
      request.setHtlcConfirmations(1)
      request.setSwapPublicationDeadline(swapPublicationDeadline)
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
          state = Object.keys(SwapState).find((key) => SwapState[key] === stateVal)
        } catch (e) {
          state = SwapState.FAILED
        }
        let message
        try {
          const failureReason = data.getFailureReason()
          message = Object.keys(FailureReason).find(
            (key) => FailureReason[key] === failureReason,
          )
        } catch (e) {
          message = ""
        }
        let swapType
        const type = data.getType()
        const parsedType = Object.keys(SwapType).find((key) => SwapType[key] === type)
        if (parsedType) {
          if (parsedType === "LOOP_OUT") {
            swapType = DomainSwapType.SWAP_OUT
          }
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

  function createClient(macaroon, tls, grpcEndpoint): SwapClientClient {
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
      const client = new SwapClientClient(grpcEndpoint, credentials, grpcOptions)
      return client
    } catch (e) {
      throw SwapClientNotResponding
    }
  }

  return {
    healthCheck,
    swapOut,
    swapListener,
  }
}
