import { GT } from "@graphql/index"
import Globals from "@graphql/types/object/globals"
import { getActiveOnchainLnd } from "@services/lnd/utils"

const GlobalsQuery = GT.Field({
  type: Globals,
  resolve: async () => {
    const { pubkey } = getActiveOnchainLnd()
    return {
      nodesIds: [pubkey],
    }
  },
})

export default GlobalsQuery
