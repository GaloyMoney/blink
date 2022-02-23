import { getGaloyBuildInformation } from "@config"
import { GT } from "@graphql/index"
import Globals from "@graphql/types/object/globals"
import { nodesPubKey } from "@services/lnd/utils"

const GlobalsQuery = GT.Field({
  type: Globals,
  resolve: async () => {
    return {
      nodesIds: nodesPubKey,
      buildInformation: getGaloyBuildInformation(),
    }
  },
})

export default GlobalsQuery
