import { GT } from "@graphql/index"
import WelcomeLeaders from "@graphql/types/object/welcome-leaders"

const WelcomeLeadersQuery = GT.Field({
  type: WelcomeLeaders,
  resolve: async () => {
    return {
      leaders: [],
    }
  },
})

export default WelcomeLeadersQuery
