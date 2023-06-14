import { decode } from "jsonwebtoken"

import { OathkeeperUnauthorizedServiceError } from "@domain/oathkeeper/errors"
import { sendOathkeeperRequestGraphql } from "@services/oathkeeper"

import {
  createApolloClient,
  defaultTestClientConfig,
  getPhoneAndCodeFromRef,
  killServer,
  startServer,
} from "test/helpers"
import { UserLoginDocument } from "test/e2e/generated"
let serverPid: PID

beforeAll(async () => {
  serverPid = await startServer("start-main-ci")
})

afterAll(async () => {
  await killServer(serverPid)
})

// TODO: if "D" failed silently.
// should have a fail safe error fallback when therer is mismatch
// between account/user on mongoose and kratos
const userRef = "L"

describe("Oathkeeper graphql endpoints", () => {
  it("return anon if no bearer assets", async () => {
    const res = await sendOathkeeperRequestGraphql(undefined)
    if (res instanceof Error) throw res

    const decoded = decode(res, { complete: true })
    expect(decoded?.payload?.sub).toBe("anon")
  })

  it("error if an invalid token is provided", async () => {
    const res = await sendOathkeeperRequestGraphql("invalid.token" as SessionToken)
    expect(res).toBeInstanceOf(OathkeeperUnauthorizedServiceError)
  })

  it("return UserId when kratos session token is provided", async () => {
    const { phone, code } = getPhoneAndCodeFromRef(userRef)

    const { apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig())

    const input = { phone, code }

    const result = await apolloClient.mutate({
      mutation: UserLoginDocument,
      variables: { input },
    })
    disposeClient()

    const token = result.data.userLogin.authToken

    const res = await sendOathkeeperRequestGraphql(token)
    if (res instanceof Error) throw res

    const decodedNew = decode(res, { complete: true })
    const uidFromJwt = decodedNew?.payload?.sub

    expect(uidFromJwt).toHaveLength(36) // uuid-v4 token (kratosUserId)
  })
})
