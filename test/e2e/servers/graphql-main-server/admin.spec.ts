import { sleep } from "@utils"

import USER_UPDATE_PHONE from "../../../e2e/servers/graphql-main-server/mutations/user-update-phone.gql"
import ACCOUNT_DETAILS_BY_USER_PHONE from "../../../e2e/servers/graphql-main-server/queries/account-details-by-user-phone.gql"

import { UserLoginDocument, UserLoginMutation } from "test/e2e/generated"
import {
  adminTestClientConfig,
  createApolloClient,
  defaultStateConfig,
  defaultTestClientConfig,
  initializeTestingState,
  killServer,
  startServer,
} from "test/e2e/helpers"
import {
  fundWalletIdFromLightning,
  getAdminPhoneAndCode,
  getDefaultWalletIdByTestUserRef,
  getPhoneAndCodeFromRef,
  randomPhone,
} from "test/helpers"

let serverPid: PID

beforeAll(async () => {
  await initializeTestingState(defaultStateConfig())
  serverPid = await startServer("start-main-ci")
})

afterAll(async () => {
  await killServer(serverPid)
  await sleep(1000)
})

describe("updates user phone", () => {
  let newPhone: PhoneNumber

  it("updates user phone", async () => {
    const { phone, code } = getPhoneAndCodeFromRef("H")

    const { apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig())

    await apolloClient.mutate<UserLoginMutation>({
      mutation: UserLoginDocument,
      variables: { input: { phone, code } },
    })

    const { phone: adminPhone, code: adminCode } = await getAdminPhoneAndCode()

    const loginResult = await apolloClient.mutate<UserLoginMutation>({
      mutation: UserLoginDocument,
      variables: { input: { phone: adminPhone, code: adminCode } },
    })

    await disposeClient()

    const token = loginResult?.data?.userLogin?.authToken ?? undefined

    const { apolloClient: adminApolloClient, disposeClient: disposeAdminClient } =
      await createApolloClient(adminTestClientConfig(token as SessionToken | undefined))

    const accountDetails = await adminApolloClient.query({
      query: ACCOUNT_DETAILS_BY_USER_PHONE,
      variables: { phone },
    })

    const uid = accountDetails.data.accountDetailsByUserPhone.id

    newPhone = randomPhone()
    await adminApolloClient.mutate({
      mutation: USER_UPDATE_PHONE,
      variables: { input: { phone: newPhone, uid } },
    })

    const result = await adminApolloClient.query({
      query: ACCOUNT_DETAILS_BY_USER_PHONE,
      variables: { phone: newPhone },
    })

    await disposeAdminClient()

    expect(result.data.accountDetailsByUserPhone.id).toBe(uid)
  })

  // test if flacky
  it.skip("updates phone even if new phone is associated with a zero balance account, but not otherwise", async () => {
    const { apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig())
    const { phone, code } = getPhoneAndCodeFromRef("I")
    const walletId = await getDefaultWalletIdByTestUserRef("I")

    apolloClient.mutate({
      mutation: UserLoginDocument,
      variables: { input: { phone, code } },
    })

    const { phone: adminPhone, code: adminCode } = await getAdminPhoneAndCode()

    const loginResult = await apolloClient.mutate({
      mutation: UserLoginDocument,
      variables: { input: { phone: adminPhone, code: adminCode } },
    })

    disposeClient()

    const { apolloClient: adminApolloClient, disposeClient: disposeAdminClient } =
      createApolloClient(adminTestClientConfig(loginResult.data.userLogin.authToken))

    const accountDetails = await adminApolloClient.query({
      query: ACCOUNT_DETAILS_BY_USER_PHONE,
      variables: { phone },
    })

    const uid = accountDetails.data.accountDetailsByUserPhone.id

    const result = await adminApolloClient.mutate({
      mutation: USER_UPDATE_PHONE,
      variables: { input: { phone: newPhone, uid } },
    })

    // removes the phone from a user with zero balance
    expect(result.data.userUpdatePhone.errors.length).toBe(0)

    await fundWalletIdFromLightning({ walletId, amount: 1000 })

    const result1 = await adminApolloClient.mutate({
      mutation: USER_UPDATE_PHONE,
      variables: { input: { phone: newPhone, uid } },
    })

    // errors when trying to remove phone from a user with non zero balance
    expect(result1.data.userUpdatePhone.errors[0].message).toContain(
      "The phone is associated with an existing wallet that has a non zero balance",
    )

    await disposeAdminClient()
  })
})
