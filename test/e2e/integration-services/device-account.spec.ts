import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"

import { gql } from "apollo-server-core"

import { UserLoginDeviceMutation, UserLoginDeviceDocument } from "../generated"

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
  await killServer(serverPid)
})

gql`
  mutation UserLoginDevice($input: UserLoginDeviceInput!) {
    userLoginDevice(input: $input) {
      errors {
        message
      }
      authToken
    }
  }
`

// dev/ory/gen-test-jwt.ts
const jwt =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFiOTdiMjIxLWNhMDgtNGViMi05ZDA5LWE1NzcwZmNjZWIzNyJ9.eyJzdWIiOiIxOjcyMjc5Mjk3MzY2OmFuZHJvaWQ6VEVTVEUyRUFDQ09VTlQ1YWE3NWFmNyIsImF1ZCI6WyJwcm9qZWN0cy83MjI3OTI5NzM2NiIsInByb2plY3RzL2dhbG95YXBwIl0sInByb3ZpZGVyIjoiZGVidWciLCJpc3MiOiJodHRwczovL2ZpcmViYXNlYXBwY2hlY2suZ29vZ2xlYXBpcy5jb20vNzIyNzkyOTczNjYifQ.onGs8nlWA1e1vkEwJhjDtNwCk1jLNezQign7HyCNBOuAxtr7kt0Id6eZtbROuDlVlS4KwO7xMrn3xxsQHZYftu_ihO61OKBw8IEIlLn548May3HGSMletWTANxMLnhwJIjph8ACpRTockFida3XIr2cgIHwPqNRigFh0Ib9HTG5cuzRpQUEkpgiXZ2dJ0hJppX5OX6Q2ywN5LD4mqqqbXV3VNqtGd9oCUI-t7Kfry4UpNBhkhkPzMc5pt_NRsIHFqGtyH1SRX7NJd8BZuPnVfS6zmoPHaOxOixEO4zhFgh_DRePg6_yT4ejRF29mx1gBhfKSz81R5_BVtjgD-LMUdg"

describe("DeviceAccountService", () => {
  it("create a device user", async () => {
    ;({ apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig()))

    const result = await apolloClient.mutate<UserLoginDeviceMutation>({
      mutation: UserLoginDeviceDocument,
      variables: {
        input: {
          jwt,
        },
      },
    })
    disposeClient()
    expect(result.data?.userLoginDevice.authToken).toBeDefined()
  })
})
