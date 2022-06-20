import { getGaloyBuildInformation } from "@config"

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
      buildInformation: getGaloyBuildInformation(),
    }
  },
})

export default GlobalsQuery
