import { getLoopConfig } from "@config"

import { loopRestClient } from "./loop-rest-client"

export const loopOut = async () => {
  // const outboundLiquidityBalance = 1 // @todo get this from LND
  // const maxOutboundLiquidityBalance = getLoopConfig().maxOutboundLiquidityBalance
  const loopoutAmount = getLoopConfig().loopoutAmount

  // @todo - Threshold logic here
  //if (outboundLiquidityBalance > maxOutboundLiquidityBalance) {
  const resp = await loopRestClient.loopOut(loopoutAmount)
  console.log(resp.data)
  return resp.data
}
