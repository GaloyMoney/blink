import crypto from "crypto"

import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"
import { toSats } from "@domain/bitcoin"

import { gql } from "apollo-server-core"

import {
  clearAccountLocks,
  clearLimiters,
  createApolloClient,
  defaultStateConfig,
  defaultTestClientConfig,
  fundWalletIdFromLightning,
  getDefaultWalletIdByTestUserRef,
  getPhoneAndCodeFromRef,
  promisifiedSubscription,
  initializeTestingState,
  killServer,
  startServer,
} from "test/helpers"
import { loginFromPhoneAndCode, updateUsername } from "test/e2e/account-creation-e2e"
import {
  LnInvoiceCreateOnBehalfOfRecipientDocument,
  LnInvoiceCreateOnBehalfOfRecipientMutation,
  LnInvoicePaymentSendDocument,
  LnInvoicePaymentSendMutation,
  LnNoAmountInvoiceCreateOnBehalfOfRecipientDocument,
  LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation,
  MeDocument,
  MeQuery,
  NodeIdsDocument,
  NodeIdsQuery,
  UserDefaultWalletIdDocument,
  UserDefaultWalletIdQuery,
  UserLoginDocument,
  UserLoginMutation,
  LnInvoicePaymentStatusQueryDocument,
  LnInvoicePaymentStatusSubscriptionDocument,
  LnInvoicePaymentStatusSubscriptionSubscription,
} from "test/e2e/generated"

let apolloClient: ApolloClient<NormalizedCacheObject>,
  disposeClient: () => void = () => null,
  receivingWalletId: WalletId,
  serverPid: PID
const receivingUsername = "user15" as Username
const receivingUserRef = "G"
const sendingUserRef = "D"

const { phone, code } = getPhoneAndCodeFromRef(sendingUserRef)
const { phone: phoneRecipient, code: codeRecipient } =
  getPhoneAndCodeFromRef(receivingUserRef)

beforeAll(async () => {
  await initializeTestingState(defaultStateConfig())
  serverPid = await startServer("start-main-ci")

  await loginFromPhoneAndCode({ phone, code })
  const client = await loginFromPhoneAndCode({
    phone: phoneRecipient,
    code: codeRecipient,
  })
  await updateUsername({ apolloClient: client, username: receivingUsername })

  const sendingWalletId = await getDefaultWalletIdByTestUserRef(sendingUserRef)
  await fundWalletIdFromLightning({ walletId: sendingWalletId, amount: toSats(50_000) })
  receivingWalletId = await getDefaultWalletIdByTestUserRef(receivingUserRef)
  ;({ apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig()))
  const input = { phone, code }
  const result = await apolloClient.mutate<UserLoginMutation>({
    mutation: UserLoginDocument,
    variables: { input },
  })
  // Create a new authenticated client
  disposeClient()
  const authToken = result?.data?.userLogin?.authToken as SessionToken
  if (!authToken) {
    throw new Error("No auth token returned")
  }
  ;({ apolloClient, disposeClient } = createApolloClient(
    defaultTestClientConfig(authToken),
  ))
})

beforeEach(async () => {
  await clearLimiters()
  await clearAccountLocks()
})

afterAll(async () => {
  disposeClient()
  await killServer(serverPid)
})

describe("galoy-pay", () => {
  describe("getDefaultWalletId", () => {
    gql`
      query userDefaultWalletId($username: Username!) {
        userDefaultWalletId(username: $username)
      }
    `

    it("returns a value for an existing username", async () => {
      const input = { username: receivingUsername }

      const result = await apolloClient.query<UserDefaultWalletIdQuery>({
        query: UserDefaultWalletIdDocument,
        variables: input,
      })
      const walletId = result.data.userDefaultWalletId

      expect(walletId).toBeTruthy()
    })

    it("returns an error for invalid username syntax", async () => {
      const input = { username: "username-incorrectly-formatted" }
      const message = "Invalid value for Username"
      const result = await apolloClient.query<UserDefaultWalletIdQuery>({
        query: UserDefaultWalletIdDocument,
        variables: input,
      })

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: expect.stringContaining(message) }),
        ]),
      )
    })

    it("returns an error for an inexistent username", async () => {
      const input = { username: "user1234" }
      const message = "Account does not exist for username"

      const result = await apolloClient.query<UserDefaultWalletIdQuery>({
        query: UserDefaultWalletIdDocument,
        variables: input,
      })

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: expect.stringContaining(message) }),
        ]),
      )
    })
  })

  describe("nodeIds", () => {
    gql`
      query nodeIds {
        globals {
          nodesIds
          network
        }
      }
    `

    it("returns a nonempty list of nodes", async () => {
      const result = await apolloClient.query<NodeIdsQuery>({ query: NodeIdsDocument })
      expect(result?.data?.globals?.nodesIds.length).toBeGreaterThan(0)
    })
  })

  describe("lnInvoiceCreateOnBehalfOfRecipient", () => {
    gql`
      mutation lnInvoiceCreateOnBehalfOfRecipient(
        $walletId: WalletId!
        $amount: SatAmount!
        $descriptionHash: Hex32Bytes!
      ) {
        mutationData: lnInvoiceCreateOnBehalfOfRecipient(
          input: {
            recipientWalletId: $walletId
            amount: $amount
            descriptionHash: $descriptionHash
          }
        ) {
          errors {
            message
          }
          invoice {
            paymentRequest
            paymentHash
            paymentSecret
            satoshis
          }
        }
      }
    `

    it("creates an invoice with valid inputs", async () => {
      const metadata = JSON.stringify([["text/plain", `Payment to ${receivingUsername}`]])
      const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")
      const input = {
        walletId: receivingWalletId,
        amount: 1000,
        descriptionHash,
      }

      const result =
        await apolloClient.mutate<LnInvoiceCreateOnBehalfOfRecipientMutation>({
          mutation: LnInvoiceCreateOnBehalfOfRecipientDocument,
          variables: input,
        })

      const data = result?.data?.mutationData
      if (!data) throw new Error("no data returned from mutation")

      const { invoice, errors } = data

      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice?.paymentRequest.startsWith("lnbc")).toBeTruthy()
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
      expect(invoice?.satoshis).toBeGreaterThan(0)
    })

    it("fails to create an invoice for a nonexistent walletId", async () => {
      const metadata = JSON.stringify([["text/plain", `Payment to ${receivingUsername}`]])
      const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")
      const input = {
        walletId: "wallet-id-does-not-exist",
        amount: 1000,
        descriptionHash,
      }

      const result =
        await apolloClient.mutate<LnInvoiceCreateOnBehalfOfRecipientMutation>({
          mutation: LnInvoiceCreateOnBehalfOfRecipientDocument,
          variables: input,
        })

      const data = result?.data?.mutationData
      if (!data) throw new Error("no data returned from mutation")

      const { invoice, errors } = data

      expect(invoice).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })

    it("returns an error with a negative amount", async () => {
      const metadata = JSON.stringify([["text/plain", `Payment to ${receivingUsername}`]])
      const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")
      const input = {
        walletId: receivingWalletId,
        amount: -1,
        descriptionHash,
      }

      const result =
        await apolloClient.mutate<LnInvoiceCreateOnBehalfOfRecipientMutation>({
          mutation: LnInvoiceCreateOnBehalfOfRecipientDocument,
          variables: input,
        })

      const data = result?.data?.mutationData
      if (!data) throw new Error("no data returned from mutation")

      const { invoice, errors } = data

      expect(errors.length).toBeGreaterThan(0)
      expect(invoice).toBe(null)
    })

    it("returns an error with a zero amount", async () => {
      const metadata = JSON.stringify([["text/plain", `Payment to ${receivingUsername}`]])
      const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")
      const input = {
        walletId: receivingWalletId,
        amount: 0,
        descriptionHash,
      }

      const result =
        await apolloClient.mutate<LnInvoiceCreateOnBehalfOfRecipientMutation>({
          mutation: LnInvoiceCreateOnBehalfOfRecipientDocument,
          variables: input,
        })

      const data = result?.data?.mutationData
      if (!data) throw new Error("no data returned from mutation")

      const { invoice, errors } = data

      expect(errors.length).toBeGreaterThan(0)
      expect(invoice).toBe(null)
    })
  })

  describe("lnInvoicePaymentStatus", () => {
    gql`
      mutation lnNoAmountInvoiceCreateOnBehalfOfRecipient($walletId: WalletId!) {
        mutationData: lnNoAmountInvoiceCreateOnBehalfOfRecipient(
          input: { recipientWalletId: $walletId }
        ) {
          errors {
            message
          }
          invoice {
            paymentRequest
          }
        }
      }

      mutation LnInvoicePaymentSend($input: LnInvoicePaymentInput!) {
        lnInvoicePaymentSend(input: $input) {
          errors {
            message
          }
          status
        }
      }

      subscription lnInvoicePaymentStatusSubscription(
        $input: LnInvoicePaymentStatusInput!
      ) {
        lnInvoicePaymentStatus(input: $input) {
          errors {
            message
          }
          status
        }
      }

      query LnInvoicePaymentStatusQuery($input: LnInvoicePaymentStatusInput!) {
        lnInvoicePaymentStatus(input: $input) {
          status
        }
      }
    `

    it("returns payment status when paid", async () => {
      // Create an invoice on behalf of userA
      const metadata = JSON.stringify([["text/plain", `Payment to ${receivingUsername}`]])
      const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")
      const createPaymentRequestInput = {
        walletId: receivingWalletId,
        amount: 1000,
        descriptionHash,
      }

      const createInvoice =
        await apolloClient.mutate<LnInvoiceCreateOnBehalfOfRecipientMutation>({
          mutation: LnInvoiceCreateOnBehalfOfRecipientDocument,
          variables: createPaymentRequestInput,
        })

      const paymentRequest = createInvoice?.data?.mutationData?.invoice?.paymentRequest

      // Subscribe to the invoice
      const subscribeToPaymentInput = { paymentRequest }
      const subscription =
        apolloClient.subscribe<LnInvoicePaymentStatusSubscriptionSubscription>({
          query: LnInvoicePaymentStatusSubscriptionDocument,
          variables: { input: subscribeToPaymentInput },
        })
      const resultPending = (await promisifiedSubscription(subscription)) as { data }
      expect(resultPending.data.lnInvoicePaymentStatus.status).toEqual("PENDING")

      const statusQuery = async () => {
        await apolloClient.resetStore()
        return apolloClient.query({
          query: LnInvoicePaymentStatusQueryDocument,
          variables: { input: subscribeToPaymentInput },
        })
      }
      const pendingStatusResult = await statusQuery()
      expect(pendingStatusResult.data.lnInvoicePaymentStatus.status).toEqual("PENDING")

      // Pay the invoice
      const res = await apolloClient.query<MeQuery>({ query: MeDocument })
      const fundingWalletId = res?.data?.me?.defaultAccount.defaultWalletId
      if (!fundingWalletId) throw new Error("no funding wallet id found")

      const makePaymentInput = { walletId: fundingWalletId, paymentRequest }
      const makePayment = await apolloClient.mutate<LnInvoicePaymentSendMutation>({
        mutation: LnInvoicePaymentSendDocument,
        variables: { input: makePaymentInput },
      })
      expect(makePayment?.data?.lnInvoicePaymentSend?.status).toEqual("SUCCESS")

      const statusQueryResult = await statusQuery()
      expect(statusQueryResult.data.lnInvoicePaymentStatus.status).toEqual("PAID")

      const result = (await promisifiedSubscription(subscription)) as { data }
      expect(result.data.lnInvoicePaymentStatus.status).toEqual("PAID")
    })
  })

  describe("lnNoAmountInvoiceCreateOnBehalfOfRecipient", () => {
    it("returns a valid lightning invoice", async () => {
      const input = { walletId: receivingWalletId }

      const result =
        await apolloClient.mutate<LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation>({
          mutation: LnNoAmountInvoiceCreateOnBehalfOfRecipientDocument,
          variables: input,
        })
      const mutationData = result?.data?.mutationData
      if (!mutationData) throw new Error("no data returned from mutation")
      const { invoice, errors } = mutationData

      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice?.paymentRequest.startsWith("lnbc")).toBeTruthy()
    })

    it("returns an error with an invalid walletId", async () => {
      const input = { walletId: "wallet-id-does-not-exist" }

      const result =
        await apolloClient.mutate<LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation>({
          mutation: LnNoAmountInvoiceCreateOnBehalfOfRecipientDocument,
          variables: input,
        })
      const mutationData = result?.data?.mutationData
      if (!mutationData) throw new Error("no data returned from mutation")
      const { invoice, errors } = mutationData

      expect(invoice).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})
