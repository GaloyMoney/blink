import { randomUUID } from "crypto"

import { kratosAdmin } from "@services/kratos/private"

import { AuthWithDeviceAccountService } from "@services/kratos/auth-device-account"

import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"

import { Accounts } from "@app/index"

import { WalletType } from "@domain/wallets"

import { WalletCurrency } from "@domain/shared"

import { LedgerService } from "@services/ledger"

import USER_CREATE_DEVICE_ACCOUNT from "../servers/graphql-main-server/mutations/user-device-account-create.gql"
import USER_LOGIN_UPGRADE from "../servers/graphql-main-server/mutations/user-login-upgrade.gql"
import MAIN from "../servers/graphql-main-server/queries/main.gql"

import {
  bitcoindClient,
  clearAccountLocks,
  clearLimiters,
  createApolloClient,
  defaultStateConfig,
  defaultTestClientConfig,
  fundWalletIdFromLightning,
  getAccountIdByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  getPhoneAndCodeFromRef,
  initializeTestingState,
  killServer,
  randomPhone,
  startServer,
} from "test/helpers"
import { loginFromPhoneAndCode } from "test/helpers/account-creation-e2e"

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

    // initiate graphql call with DeviceId
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

describe("DeviceAccountService", () => {
  const authService = AuthWithDeviceAccountService()
  let kratosUserId: UserId

  it("create a user", async () => {
    const res = await authService.create()
    if (res instanceof Error) throw res

    expect(res).toHaveProperty("sessionToken")

    kratosUserId = res.kratosUserId

    const { data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(identity.schema_id).toBe("device_account_v0")
  })

  it("upgrade user", async () => {
    // TODO: test if there is a phone (or phone+email) collision
    await authService.upgradeToPhoneSchema({ kratosUserId, phone: randomPhone() })

    const { data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(identity.schema_id).toBe("phone_no_password_v0")
  })
})

describe("DeviceAccountGraphQL", () => {
  it("account destination does not exist", async () => {
    const userRef = "N"
    const { phone, code } = getPhoneAndCodeFromRef(userRef)

    ;({ apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig()))

    const result = await apolloClient.mutate({
      mutation: USER_CREATE_DEVICE_ACCOUNT,
      variables: { input: { deviceId: randomUUID() } },
    })

    // Create a first authenticated client
    const authToken = result.data.userDeviceAccountCreate.authToken
    disposeClient()
    ;({ apolloClient, disposeClient } = createApolloClient(
      defaultTestClientConfig(authToken),
    ))

    const meResult1 = await apolloClient.query({
      query: MAIN,
      variables: { hasToken: true },
    })
    const walletId = meResult1.data.me.defaultAccount.defaultWalletId
    expect(walletId).toBeDefined()

    const result2 = await apolloClient.mutate({
      mutation: USER_LOGIN_UPGRADE,
      variables: { input: { phone, code, authToken } },
    })

    // Create a new upgraded authenticated graphql client
    const newAuthToken = result2.data.userLoginUpgrade.authToken
    const { apolloClient: apolloNewClient, disposeClient: disposeNewClient } =
      createApolloClient(defaultTestClientConfig(newAuthToken))

    const meResult2 = await apolloNewClient.query({
      query: MAIN,
      variables: { hasToken: true },
    })
    expect(walletId).toBe(meResult2.data.me.defaultAccount.defaultWalletId)

    // FIXME:
    // kratos token not revoked

    // const meResult3 = apolloClient.query({
    //   query: MAIN,
    //   variables: { hasToken: true },
    // })
    // const res = await meResult3
    // baseLogger.warn(res)
    // expect(await meResult3).toThrow()

    disposeNewClient()
    disposeClient()
  })

  it("account destination exist", async () => {
    // create new destination account
    const userRef = "M"
    const { phone, code } = getPhoneAndCodeFromRef(userRef)
    await loginFromPhoneAndCode({ phone, code })
    const orgAccountId = await getAccountIdByTestUserRef(userRef)
    const orgWalletId = await getDefaultWalletIdByTestUserRef(userRef)
    const orgUsdWallet = await Accounts.addWalletIfNonexistent({
      accountId: orgAccountId,
      type: WalletType.Checking,
      currency: WalletCurrency.Usd,
    })
    if (orgUsdWallet instanceof Error)
      throw orgUsdWallet

      // create device account client
    ;({ apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig()))
    const result = await apolloClient.mutate({
      mutation: USER_CREATE_DEVICE_ACCOUNT,
      variables: { input: { deviceId: randomUUID() } },
    })

    // get authenticated graphql device account client
    disposeClient()
    const authToken = result.data.userDeviceAccountCreate.authToken
    ;({ apolloClient, disposeClient } = createApolloClient(
      defaultTestClientConfig(authToken),
    ))

    const meResult1 = await apolloClient.query({
      query: MAIN,
      variables: { hasToken: true },
    })
    const walletId = meResult1.data.me.defaultAccount.defaultWalletId
    expect(walletId).toBeDefined()

    // quirks because the accountId in graphql is not accountId in db...
    const userId = meResult1.data.me.id
    const account = await Accounts.getAccountFromUserId(userId)
    if (account instanceof Error) throw account

    const usdWallet = await Accounts.addWalletIfNonexistent({
      accountId: account.id,
      type: WalletType.Checking,
      currency: WalletCurrency.Usd,
    })
    if (usdWallet instanceof Error) throw usdWallet
    const usdWalletId = usdWallet.id

    // receive tx in the device account id client
    // we have 2 BTC and 3 USD transactions to check the whole balance is been transferred.
    await fundWalletIdFromLightning({ walletId: walletId, amount: 500 })
    await fundWalletIdFromLightning({ walletId: walletId, amount: 500 })
    await fundWalletIdFromLightning({ walletId: usdWalletId, amount: 100 })
    await fundWalletIdFromLightning({ walletId: usdWalletId, amount: 100 })
    await fundWalletIdFromLightning({ walletId: usdWalletId, amount: 100 })

    // upgrade to phone account
    const result2 = await apolloClient.mutate({
      mutation: USER_LOGIN_UPGRADE,
      variables: { input: { phone, code, authToken } },
    })

    // Create a new upgraded authenticated graphql client
    const newAuthToken = result2.data.userLoginUpgrade.authToken
    const { apolloClient: apolloNewClient, disposeClient: disposeNewClient } =
      createApolloClient(defaultTestClientConfig(newAuthToken))

    const meResult2 = await apolloNewClient.query({
      query: MAIN,
      variables: { hasToken: true },
    })
    const newWalletId = meResult2.data.me.defaultAccount.defaultWalletId
    expect(walletId).not.toBe(newWalletId)
    expect(newWalletId).toBe(orgWalletId)

    // balance should have been transferred to the new account
    const wallets = meResult2.data.me.defaultAccount.wallets
    expect(wallets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          walletCurrency: "BTC",
          balance: 1000,
          id: newWalletId,
        }),
        expect.objectContaining({
          walletCurrency: "USD",
          balance: 300,
        }),
      ]),
    )
    disposeNewClient()

    // device account balance is at 0 and deactivated

    const ls = LedgerService()
    expect(await ls.getWalletBalance(walletId)).toBe(0)
    expect(await ls.getWalletBalance(usdWalletId)).toBe(0)

    // FIXME: doesn't work
    // kratos token not revoked
    // locked account not really locked

    // const meResult3 = apolloClient.query({
    //   query: MAIN,
    //   variables: { hasToken: true },
    // })
    // const res = await meResult3
    // baseLogger.warn(res)
    // expect(await meResult3).toThrow()

    disposeClient()
  })
})
