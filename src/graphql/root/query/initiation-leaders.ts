import { GT } from "@graphql/index"
import InitiationLeaders from "@graphql/types/object/initiation-leaders"

const InitiationLeadersQuery = GT.Field({
  type: InitiationLeaders,
  resolve: async () => {
    return {
      leaders: [],
    }
  },
})

export default InitiationLeadersQuery
