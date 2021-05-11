const { createTestClient } = require('apollo-server-testing');
import { startApolloServer } from "../entrypoint/graphql"
import { sleep } from "../utils";
import { baseLogger } from '../logger'

it('start server', async () => {
  const { server } = await startApolloServer()
  await sleep(2500)

  const { query, mutate } = createTestClient(server)
  
  const rest = await query({query: `query nodeStats {
    nodeStats {
        id
        peersCount
        channelsCount
    }
  }`})

  baseLogger.info({rest})
})

