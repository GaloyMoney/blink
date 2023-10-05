import { NETWORK, getLoopConfig, getSwapConfig } from "@/config"
import { SwapErrorNoActiveLoopdNode } from "@/domain/swap/errors"
import { getActiveLnd } from "@/services/lnd/config"

export const getActiveLoopd = (): LoopdConfig => {
  const activeOffChainNode = getActiveLnd()
  if (activeOffChainNode instanceof Error) throw new SwapErrorNoActiveLoopdNode()
  switch (activeOffChainNode.name.toLowerCase()) {
    case "lnd1": {
      return lnd1LoopConfig()
    }
    case "lnd2": {
      return lnd2LoopConfig()
    }
    default: {
      throw new SwapErrorNoActiveLoopdNode()
    }
  }
}

export const lnd1LoopConfig = (): LoopdConfig => ({
  btcNetwork: NETWORK,
  grpcEndpoint: getSwapConfig().lnd1loopRpcEndpoint,
  tlsCert: getLoopConfig().lnd1LoopTls,
  macaroon: getLoopConfig().lnd1LoopMacaroon,
  lndInstanceName: "LND1",
})

export const lnd2LoopConfig = (): LoopdConfig => ({
  btcNetwork: NETWORK,
  grpcEndpoint: getSwapConfig().lnd2loopRpcEndpoint,
  tlsCert: getLoopConfig().lnd2LoopTls,
  macaroon: getLoopConfig().lnd2LoopMacaroon,
  lndInstanceName: "LND2",
})
