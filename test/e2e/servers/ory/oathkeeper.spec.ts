import { decode } from "jsonwebtoken"

import { OathkeeperUnauthorizedServiceError } from "@domain/oathkeeper/errors"
import {
  sendOathkeeperRequestGraphql,
  sendOathkeeperRequestCreateDeviceAccount,
} from "@services/oathkeeper"

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

describe("Oathkeeper rest endpoints", () => {
  it("do not throw if JWT is valid", async () => {
    const token =
      "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFiOTdiMjIxLWNhMDgtNGViMi05ZDA5LWE1NzcwZmNjZWIzNyJ9.eyJzdWIiOiIxOjcyMjc5Mjk3MzY2OmFuZHJvaWQ6VEVTVEUyRUFDQ09VTlQ1YWE3NWFmNyIsImF1ZCI6WyJwcm9qZWN0cy83MjI3OTI5NzM2NiIsInByb2plY3RzL2dhbG95YXBwIl0sInByb3ZpZGVyIjoiZGVidWciLCJpc3MiOiJodHRwczovL2ZpcmViYXNlYXBwY2hlY2suZ29vZ2xlYXBpcy5jb20vNzIyNzkyOTczNjYiLCJleHAiOjI2MzkwMDAwNjl9.Fh11HcuTal_S_26xFwIUWYivY0NzKGYrpBwNgQ-1QnfLZwUaHlMCX4hj4tcRJiKMX2UU_pnZCWgVnBqM9rbeSLFj35OvyP0z4rnflLOOl-UBrQQs4pVSUCpmh8eLX5lkh27KhdGOifND3jJPkKhPeVI9-hpZKNTYdU9y3M1yFF4BjvHs05nf8Zu3tWfpj0_LNPE-H0eXiiHaEUDv_GPA4HgLSAyxdh8bFoVC36UjpG-vm8Tt7jOUDnGc3s7jQk_lIJ3uCs8JXU4LfhSAQS6Q9UYmpFFUgsrUaZ6T_o2XTZtHgd_9qOUVvTChL-0dDGyDvB1tzofwIzLwxj7TGoEDGQ" as JwtToken

    const res = await sendOathkeeperRequestCreateDeviceAccount(token)
    expect(res).not.toBeInstanceOf(Error)
  })

  it("throw if JWT is invalid", async () => {
    const token =
      "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFiOTdiMjIxLWNhMDgtNGViMi05ZDA5LWE1NzcwZmNjZWIzNyJ9.eyJzdWIiOiIxOjcyMjc5Mjk3MzY2OmFuZHJvaWQ6VEVTVEUyRUFDQ09VTlQ1YWE3NWFmNyIsImF1ZCI6WyJwcm9qZWN0cy83MjI3OTI5NzM2NiIsInByb2plY3RzL2dhbG95YXBwIl0sInByb3ZpZGVyIjoiZGVidWciLCJpc3MiOiJodHRwczovL2ZpcmViYXNlYXBwY2hlY2suZ29vZ2xlYXBpcy5jb20vNzIyNzkyOTczNjYiLCJleHAiOjI2MzkwMDAwNjl9.Fh11HcuTal_S_26xFwIUWYivY0NzKGYrpBwNgQ-1QnfLZwUaHlMCX4hj4tcRJiKMX2UU_pnZCWgVnBqM9rbeSLFj35OvyP0z4rnflLOOl-UBrQQs4pVSUCpmh8eLX5lkh27KhdGOifND3jJPkKhPeVI9-hpZKNTYdU9y3M1yFF4BjvHs05nf8Zu3tWfpj0_LNPE-H0eXiiHaEUDv_GPA4HgLSAyxdh8bFoVC36UjpG-vm8Tt7jOUDnGc3s7jQk_lIJ3uCs8JXU4LfhSAQS6Q9UYmpFFUgsrUaZ6T_o2XTZtHgd_9qOUVvTChL-0dDGyDvB1tzofwIzLwxj7TGoEDGQQ" as JwtToken

    const res = await sendOathkeeperRequestCreateDeviceAccount(token)
    expect(res).toBeInstanceOf(Error)
  })
})
