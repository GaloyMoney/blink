import { getActiveOnchainLnd } from "@services/lnd/utils"
import { SwapErrorNoActiveLoopdNode } from "@domain/swap/errors"
import { BTC_NETWORK, getSwapConfig } from "@config"

export const getActiveLoopd = (): LoopdConfig => {
  const activeNode = getActiveOnchainLnd()
  if (activeNode instanceof Error) throw SwapErrorNoActiveLoopdNode
  switch (activeNode.macaroon) {
    case process.env.LND1_MACAROON: {
      return LND1_LOOP_CONFIG
    }
    case process.env.LND2_MACAROON: {
      return LND2_LOOP_CONFIG
    }
    default: {
      return LND1_LOOP_CONFIG
    }
  }
}

export const LND1_LOOP_CONFIG: LoopdConfig = {
  btcNetwork: BTC_NETWORK,
  grpcEndpoint: getSwapConfig().lnd1loopRpcEndpoint,
  tlsCert: process.env.LND1_LOOP_TLS ?? "",
  macaroon: process.env.LND1_LOOP_MACAROON ?? "",
}

export const LND2_LOOP_CONFIG: LoopdConfig = {
  btcNetwork: BTC_NETWORK,
  grpcEndpoint: getSwapConfig().lnd2loopRpcEndpoint,
  tlsCert: process.env.LND2_LOOP_TLS ?? "",
  macaroon: process.env.LND2_LOOP_MACAROON ?? "",
}
