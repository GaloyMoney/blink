import { getActiveOnchainLnd } from "@services/lnd/utils"

import { OnChainService } from "@services/lnd/onchain-service"
import { BTC_NETWORK, getSwapConfig } from "@config"
import { TxDecoder } from "@domain/bitcoin/onchain"

import { LoopService } from "@services/loopd"

export const LoopUtils = () => {
  let loopMacaroon
  let cert
  let grpc
  // Logic to getActiveLoopService and choose the correct LND server
  // 1. get active lnd node
  // 2. get macaroon
  // 3. cross reference the active macaroon to see if it matches LND1 or LND2 macaroon
  // 4. get loop config (grpc endpoint, macaroon and tls) based off LND1 vs LND2
  const getActiveLoopService = () => {
    let loopService
    const activeNode = getActiveOnchainLnd()
    if (activeNode instanceof Error) throw Error("no getActiveOnchainLnd")
    const activeMacaroon = activeNode.macaroon
    switch (activeMacaroon) {
      case process.env.LND1_MACAROON: {
        loopMacaroon = process.env.LND1_MACAROON
        cert = process.env.LND1_LOOP_TLS
        grpc = getSwapConfig().lnd1loopRpcEndpoint
        loopService = LoopService({})
        break
      }
      case process.env.LND2_MACAROON: {
        const macaroon = process.env.LND2_LOOP_MACAROON?.toString()
        loopMacaroon = macaroon
        const tlsCert = process.env.LND2_LOOP_TLS
        cert = tlsCert
        const grpcEndpoint = getSwapConfig().lnd2loopRpcEndpoint
        grpc = grpcEndpoint
        loopService = LoopService({ macaroon, tlsCert, grpcEndpoint })
        break
      }
      default: {
        loopService = LoopService({})
        break
      }
    }
    return loopService
  }

  const getLoopService = ({
    macaroon,
    tlsCert,
    grpcEndpoint,
  }: {
    macaroon?: string
    tlsCert?: string
    grpcEndpoint?: string
  }) => {
    return LoopService({ macaroon, tlsCert, grpcEndpoint })
  }

  // logic to choose the correct onChain address for the swap out destination
  // active lnd node that has ["onChain"] wallet
  const getSwapDestAddress = async () => {
    const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
    if (onChainService instanceof Error) return onChainService
    const onChainAddress = await onChainService.createOnChainAddress()
    if (onChainAddress instanceof Error) return onChainAddress
    return onChainAddress.address
  }

  return {
    getSwapDestAddress,
    getActiveLoopService,
    getLoopService,
    loopMacaroon,
    tlsCert: cert,
    grpc,
  }
}

const loopUtils = LoopUtils()

export const loopdConfig: LoopdConfig = {
  macaroon: loopUtils.loopMacaroon,
  tlsCert: loopUtils.tlsCert,
  grpcEndpoint: loopUtils.grpc,
}
