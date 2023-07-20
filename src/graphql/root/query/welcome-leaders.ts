import { GT } from "@graphql/index"
import WelcomeLeaders from "@graphql/types/object/welcome-leaders"
import { Welcomes } from "@app"

const WelcomeLeadersQuery = GT.Field({
  type: WelcomeLeaders,
  resolve: async () => {
    return {
      leaders: Welcomes.getLeaders().map(({ accountId }) => accountId),
    }
  },
})

export default WelcomeLeadersQuery
