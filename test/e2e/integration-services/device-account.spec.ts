import axios from "axios"

import { gql } from "apollo-server-core"

import {
  MeDocument,
  MeQuery,
  UserLoginUpgradeDocument,
  UserLoginUpgradeMutation,
} from "../generated"

import {
  clearAccountLocks,
  clearLimiters,
  createApolloClient,
  defaultStateConfig,
  defaultTestClientConfig,
  initializeTestingState,
  killServer,
  startServer,
} from "test/helpers"

let serverPid: PID

beforeAll(async () => {
  await initializeTestingState(defaultStateConfig())
  serverPid = await startServer("start-main-ci")
})

beforeEach(async () => {
  await clearLimiters()
  await clearAccountLocks()
})

afterAll(async () => {
  await killServer(serverPid)
})

gql`
  mutation userLoginUpgrade($input: UserLoginUpgradeInput!) {
    userLoginUpgrade(input: $input) {
      errors {
        message
        code
      }
      success
    }
  }
`

// dev/ory/gen-test-jwt.ts
const jwt =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFiOTdiMjIxLWNhMDgtNGViMi05ZDA5LWE1NzcwZmNjZWIzNyJ9.eyJzdWIiOiIxOjcyMjc5Mjk3MzY2OmFuZHJvaWQ6VEVTVEUyRUFDQ09VTlQ1YWE3NWFmNyIsImF1ZCI6WyJwcm9qZWN0cy83MjI3OTI5NzM2NiIsInByb2plY3RzL2dhbG95YXBwIl0sInByb3ZpZGVyIjoiZGVidWciLCJpc3MiOiJodHRwczovL2ZpcmViYXNlYXBwY2hlY2suZ29vZ2xlYXBpcy5jb20vNzIyNzkyOTczNjYifQ.onGs8nlWA1e1vkEwJhjDtNwCk1jLNezQign7HyCNBOuAxtr7kt0Id6eZtbROuDlVlS4KwO7xMrn3xxsQHZYftu_ihO61OKBw8IEIlLn548May3HGSMletWTANxMLnhwJIjph8ACpRTockFida3XIr2cgIHwPqNRigFh0Ib9HTG5cuzRpQUEkpgiXZ2dJ0hJppX5OX6Q2ywN5LD4mqqqbXV3VNqtGd9oCUI-t7Kfry4UpNBhkhkPzMc5pt_NRsIHFqGtyH1SRX7NJd8BZuPnVfS6zmoPHaOxOixEO4zhFgh_DRePg6_yT4ejRF29mx1gBhfKSz81R5_BVtjgD-LMUdg"

describe("DeviceAccountService", () => {
  it("create a device user", async () => {
    const OATHKEEPER_HOST = process.env.OATHKEEPER_HOST ?? "oathkeeper"
    const OATHKEEPER_PORT = process.env.OATHKEEPER_PORT ?? "4002"

    const url = `http://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/auth/create/device-account`

    const username = crypto.randomUUID()
    const password = crypto.randomUUID()
    const deviceId = crypto.randomUUID()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    headers["Appcheck"] = jwt
    const auth = Buffer.from(`${username}:${password}`, "utf8").toString("base64")
    headers["Authorization"] = `Basic ${auth}`

    const res = await axios({
      url,
      method: "POST",
      headers,
      data: {
        deviceId,
      },
    })

    const token = res.data.result
    expect(token.length).toBe(39)

    const { apolloClient, disposeClient } = createApolloClient(
      defaultTestClientConfig(token),
    )

    const meResult = await apolloClient.query<MeQuery>({ query: MeDocument })

    await disposeClient()

    const UuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    const defaultWalletId = meResult?.data?.me?.defaultAccount.defaultWalletId || ""
    expect(defaultWalletId).toMatch(UuidRegex)
    expect(meResult?.data?.me?.defaultAccount.level).toBe("ZERO")

    const phone = "+198765432116"
    const code = "321321"

    const res2 = await apolloClient.mutate<UserLoginUpgradeMutation>({
      mutation: UserLoginUpgradeDocument,
      variables: { input: { phone, code } },
    })

    if (!res2) throw new Error("res2 is undefined")
    expect(res2?.data?.userLoginUpgrade?.success).toBe(true)

    {
      const { apolloClient, disposeClient } = createApolloClient(
        defaultTestClientConfig(token),
      )

      const meResult2 = await apolloClient.query<MeQuery>({ query: MeDocument })
      expect(defaultWalletId).toBe(meResult2?.data?.me?.defaultAccount.defaultWalletId)
      expect(meResult2?.data?.me?.defaultAccount.level).toBe("ONE")

      await disposeClient()
    }
  })

  // TODO: tests with upgrade, including the scenario where the device account already have an attached phone account
})
