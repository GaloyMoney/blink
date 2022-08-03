import { getActiveOnchainLnd } from "@services/lnd/utils"

import { OnChainService } from "@services/lnd/onchain-service"
import { BTC_NETWORK, getSwapConfig } from "@config"
import { TxDecoder } from "@domain/bitcoin/onchain"

import { LoopService } from "./providers/lightning-labs/loop-service"

export const LoopUtils = () => {
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
        loopService = LoopService({})
        break
      }
      case process.env.LND2_MACAROON: {
        const macaroon = process.env.LND2_LOOP_MACAROON?.toString()
        const tlsCert = process.env.LND2_LOOP_TLS
        const grpcEndpoint = getSwapConfig().lnd2loopRpcEndpoint
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

  const getLoopService = ({ macaroon, tlsCert, grpcEndpoint }) => {
    return LoopService({ macaroon, tlsCert, grpcEndpoint })
  }

  // logic to choose the correct onChain address for the swap out destination
  // active lnd node that has ["onChain"] wallet
  const getSwapDestAddress = async () => {
    const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
    if (onChainService instanceof Error) return onChainService
    const onChainAddress = await onChainService.createOnChainAddress()
    return onChainAddress
  }

  return {
    getSwapDestAddress,
    getActiveLoopService,
    getLoopService,
  }
}
