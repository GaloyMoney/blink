import {
  BTC_NETWORK,
  getGaloyBuildInformation,
  getLightningAddressDomain,
  getLightningAddressDomainAliases,
} from "@config"

import { Lightning } from "@app"

import { GT } from "@graphql/index"
import Globals from "@graphql/types/object/globals"

const GlobalsQuery = GT.Field({
  type: Globals,
  resolve: async () => {
    let nodesIds = await Lightning.listNodesPubkeys()
    if (nodesIds instanceof Error) nodesIds = []

    return {
      nodesIds,
      network: BTC_NETWORK,
      lightningAddressDomain: getLightningAddressDomain(),
      lightningAddressDomainAliases: getLightningAddressDomainAliases(),
      buildInformation: getGaloyBuildInformation(),
    }
  },
})

export default GlobalsQuery
