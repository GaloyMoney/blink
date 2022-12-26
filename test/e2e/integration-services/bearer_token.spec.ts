import { randomUUID } from "crypto"

import { kratosAdmin } from "@services/kratos/private"

import { AuthWithBearerTokenService } from "@services/kratos/auth-bearer-token"

import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"

import USER_CREATE_BEARER from "../servers/graphql-main-server/mutations/user-create-bearer.gql"
import ME from "../servers/graphql-main-server/queries/me.gql"

import {
  bitcoindClient,
  clearAccountLocks,
  clearLimiters,
  createApolloClient,
  defaultStateConfig,
  defaultTestClientConfig,
  initializeTestingState,
  killServer,
  randomPhone,
  startServer,
} from "test/helpers"

let apolloClient: ApolloClient<NormalizedCacheObject>, serverPid: PID
let disposeClient: () => void = () => null

beforeAll(async () => {
  await initializeTestingState(defaultStateConfig())
  serverPid = await startServer("start-main-ci")
})

beforeEach(async () => {
  await clearLimiters()
  await clearAccountLocks()
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
  await killServer(serverPid)
})

/*
    FLOW:

    const mapping: { [key: string]: string } = {}

    // initiate graphql call with DevideId
    // on mobile
    const deviceId = randomUUID()
    graphql.initiateTokenBearer(deviceId, notificationToken)

    // on backend
    const challenge = randomUUID()
    mapping[deviceId] = challenge
    sendNotification(notificationToken, challenge) // data notification

    // validateTokenBearer
    // on mobile
    graphql.validateTokenBearer(challenge)

    // on backend
    if (mapping[deviceId] == challenge) {
      const kratostoken = generateKratosIdentity()
      return kratostoken
    }

*/

// look at approov.io?

describe("bearerTokenService", () => {
  const authService = AuthWithBearerTokenService()
  let kratosUserId: UserId

  it("create a user", async () => {
    const res = await authService.create()
    if (res instanceof Error) throw res

    expect(res).toHaveProperty("sessionToken")

    kratosUserId = res.kratosUserId

    const { data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(identity.schema_id).toBe("bearer_token")
  })

  it("upgrade user", async () => {
    // TODO: test if there is a phone (or phone+email) collision
    await authService.upgradeToPhoneSchema({ kratosUserId, phone: randomPhone() })

    const { data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(identity.schema_id).toBe("phone_no_password_v0")
  })
})

describe("bearerTokenGraphQL", () => {
  it("createAccount", async () => {
    ;({ apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig()))

    const result = await apolloClient.mutate({
      mutation: USER_CREATE_BEARER,
      variables: { input: { deviceId: randomUUID() } },
    })

    // Create a new authenticated client
    disposeClient()
    ;({ apolloClient, disposeClient } = createApolloClient(
      defaultTestClientConfig(result.data.userCreateBearer.authToken),
    ))

    const meResult = await apolloClient.query({ query: ME })
    expect(meResult.data.me.defaultAccount.defaultWalletId).toBeDefined()
  })
})
