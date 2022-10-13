import { OathkeeperUnauthorizedServiceError } from "@domain/oathkeeper/errors"
import { sendOathkeeperRequest } from "@services/oathkeeper"
import * as jwt from "jsonwebtoken"

import USER_LOGIN from "../../../e2e/servers/graphql-main-server/mutations/user-login.gql"

import {
  createApolloClient,
  defaultTestClientConfig,
  getPhoneAndCodeFromRef,
  killServer,
  PID,
  startServer,
} from "test/helpers"

let serverPid: PID

beforeAll(async () => {
  serverPid = await startServer("start-main-ci")
})

afterAll(async () => {
  await killServer(serverPid)
})

describe("Oathkeeper", () => {
  it("return anon if no bearer assets", async () => {
    const res = await sendOathkeeperRequest()
    if (res instanceof Error) throw res

    const decoded = jwt.decode(res, { complete: true })
    expect(decoded?.payload?.sub).toBe("anon")
  })

  it("error if an invalid token is provided", async () => {
    const res = await sendOathkeeperRequest("invalid.token")
    expect(res).toBeInstanceOf(OathkeeperUnauthorizedServiceError)
  })

  it("return account id when token is provided", async () => {
    const userRef = "D"
    const { phone, code } = getPhoneAndCodeFromRef(userRef)

    const { apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig())

    const input = { phone, code }

    const result = await apolloClient.mutate({
      mutation: USER_LOGIN,
      variables: { input },
    })
    disposeClient()

    const originalToken = result.data.userLogin.authToken

    const res = await sendOathkeeperRequest(originalToken)
    if (res instanceof Error) throw res

    const decodedNew = jwt.decode(res, { complete: true })
    const decodedOriginal = jwt.decode(originalToken, { complete: true })

    if (typeof decodedOriginal?.payload === "string") {
      throw Error("should be an object")
    }

    expect(decodedNew?.payload?.sub).toBe(decodedOriginal?.payload?.uid)
  })
})
