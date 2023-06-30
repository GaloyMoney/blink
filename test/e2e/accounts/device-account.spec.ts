import axios from "axios"

import { gql } from "apollo-server-core"

import {
  AccountDeleteDocument,
  AccountDeleteMutation,
  MeDocument,
  MeQuery,
  UserLoginUpgradeDocument,
  UserLoginUpgradeMutation,
} from "../generated"

import {
  createApolloClient,
  defaultStateConfig,
  defaultTestClientConfig,
  initializeTestingState,
  killServer,
  startServer,
} from "test/e2e/helpers"
import { clearAccountLocks, clearLimiters, fundWalletIdFromLightning } from "test/helpers"

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

const UuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

gql`
  mutation userLoginUpgrade($input: UserLoginUpgradeInput!) {
    userLoginUpgrade(input: $input) {
      errors {
        message
        code
      }
      success
      authToken
    }
  }
`

gql`
  mutation accountDelete {
    accountDelete {
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
const OATHKEEPER_HOST = process.env.OATHKEEPER_HOST ?? "oathkeeper"
const OATHKEEPER_PORT = process.env.OATHKEEPER_PORT ?? "4002"

describe("device-account", () => {
  let token: SessionToken
  let defaultWalletId: string

  it("create a device user", async () => {
    const url = `http://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/auth/create/device-account`

    const username = crypto.randomUUID()
    const password = crypto.randomUUID()

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
    })

    token = res.data.result
    expect(token.length).toBe(39)

    {
      const { apolloClient, disposeClient } = createApolloClient(
        defaultTestClientConfig(token),
      )

      const meResult = await apolloClient.query<MeQuery>({ query: MeDocument })

      await disposeClient()

      defaultWalletId = meResult?.data?.me?.defaultAccount.defaultWalletId || ""
      expect(defaultWalletId).toMatch(UuidRegex)
      expect(meResult?.data?.me?.defaultAccount.level).toBe("ZERO")
    }

    // api is re-entrant
    {
      const res2 = await axios({
        url,
        method: "POST",
        headers,
      })

      token = res2.data.result
      expect(token.length).toBe(39)

      const { apolloClient, disposeClient } = createApolloClient(
        defaultTestClientConfig(token),
      )

      const meResult = await apolloClient.query<MeQuery>({ query: MeDocument })
      await disposeClient()
      expect(defaultWalletId).toBe(meResult?.data?.me?.defaultAccount.defaultWalletId)
    }
  })

  it("upgrade a device user", async () => {
    const { apolloClient, disposeClient } = createApolloClient(
      defaultTestClientConfig(token),
    )

    const phone = "+198765432116"
    const code = "321321"

    const res2 = await apolloClient.mutate<UserLoginUpgradeMutation>({
      mutation: UserLoginUpgradeDocument,
      variables: { input: { phone, code } },
    })

    if (!res2) throw new Error("res2 is undefined")
    expect(res2?.data?.userLoginUpgrade?.success).toBe(true)

    {
      const meResult2 = await apolloClient.query<MeQuery>({ query: MeDocument })
      expect(defaultWalletId).toBe(meResult2?.data?.me?.defaultAccount.defaultWalletId)
      expect(meResult2?.data?.me?.defaultAccount.level).toBe("ONE")

      await disposeClient()
    }
  })

  it("upgrade a device user to existing phone with no txns", async () => {
    let newToken: SessionToken

    {
      const { apolloClient, disposeClient } = createApolloClient(
        defaultTestClientConfig(token),
      )

      // existing phone
      const phone = "+198765432116"
      const code = "321321"

      const res3 = await apolloClient.mutate<UserLoginUpgradeMutation>({
        mutation: UserLoginUpgradeDocument,
        variables: { input: { phone, code } },
      })

      if (!res3) throw new Error("res3 is undefined")
      // existing phone accounts return a authToken

      const authToken = res3?.data?.userLoginUpgrade?.authToken
      expect(authToken).toBeDefined()
      if (!authToken) throw new Error("authToken is undefined")
      newToken = authToken as SessionToken

      expect(res3?.data?.userLoginUpgrade?.success).toBeTruthy()

      await disposeClient()
    }

    // preparation for the next test
    const { apolloClient, disposeClient } = createApolloClient(
      defaultTestClientConfig(newToken),
    )

    const meResult = await apolloClient.query<MeQuery>({ query: MeDocument })
    expect(defaultWalletId).toBe(meResult?.data?.me?.defaultAccount.defaultWalletId)

    await fundWalletIdFromLightning({ walletId: defaultWalletId as WalletId, amount: 10 })
    await disposeClient()
  })

  it("can't upgrade if the both account has funds", async () => {
    const { apolloClient, disposeClient } = createApolloClient(
      defaultTestClientConfig(token),
    )

    const meResult = await apolloClient.query<MeQuery>({ query: MeDocument })
    const newWalletId = meResult?.data?.me?.defaultAccount.defaultWalletId || ""
    await fundWalletIdFromLightning({ walletId: newWalletId as WalletId, amount: 5 })

    // existing phone
    const phone = "+198765432116"
    const code = "321321"

    const res3 = await apolloClient.mutate<UserLoginUpgradeMutation>({
      mutation: UserLoginUpgradeDocument,
      variables: { input: { phone, code } },
    })

    expect(res3?.data?.userLoginUpgrade?.authToken).toBeNull()
    expect(res3?.data?.userLoginUpgrade?.success).toBeDefined()
    expect(res3?.data?.userLoginUpgrade?.success).toBeFalsy()
    expect(res3?.data?.userLoginUpgrade?.errors[0].code).toBe(
      "PHONE_ACCOUNT_ALREADY_EXISTS_NEED_TO_SWEEP_FUNDS_ERROR",
    )

    await disposeClient()
  })

  it("deletes a device account", async () => {
    const url = `http://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/auth/create/device-account`

    const username = crypto.randomUUID()
    const password = crypto.randomUUID()

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
    })
    token = res.data.result
    expect(token.length).toBe(39)

    const { apolloClient, disposeClient } = createApolloClient(
      defaultTestClientConfig(token),
    )
    const accountDeleteResult = await apolloClient.mutate<AccountDeleteMutation>({
      mutation: AccountDeleteDocument,
    })
    await disposeClient()
    expect(accountDeleteResult?.data?.accountDelete.success).toBe(true)
  })
})
