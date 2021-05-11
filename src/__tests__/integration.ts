const { createTestClient } = require('apollo-server-testing');
import { startApolloServer } from "../entrypoint/graphql"
import { sleep } from "../utils";
import { baseLogger } from '../logger'

let server

beforeAll(async () => {
  ({ server } = await startApolloServer())
  await sleep(2500)
})

it('start server', async () => {
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

it('rate limit limiterRequestPhoneCode', async () => {
  const { mutate } = createTestClient(server)
  const phone = "+123"

  const mutation = `mutation requestPhoneCode ($phone: String) {
    requestPhoneCode (phone: $phone) {
        success
    }
  }`

  // exhaust the limiter
  for (let i = 0; i < 3; i++) {
    console.log(i);
    await mutate({mutation, variables: {phone}})
  }
  
  try {
    const { errors: [{code}]} = await mutate({mutation, variables: {phone}})
    expect(code).toBe("TOO_MANY_REQUEST")
  } catch (err) {
    expect(true).toBeFalsy()
  }
})

afterAll(async () => {
  await sleep(2500)
})
