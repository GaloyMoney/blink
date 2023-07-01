import { ApolloClient, NormalizedCacheObject } from "@apollo/client"

import { Accounts } from "@app"
import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"

import { loginFromPhoneAndCode } from "test/e2e/helpers/account-creation"

import {
  defaultStateConfig,
  initializeTestingState,
  killServer,
  startServer,
} from "test/e2e/helpers"

import {
  LnInvoicePaymentSendDocument,
  LnInvoicePaymentSendMutation,
  TransactionsDocument,
  TransactionsQuery,
} from "test/e2e/generated"

import {
  bitcoindClient,
  bitcoindSignerClient,
  checkIsBalanced,
  createInvoice,
  fundWalletIdFromLightning,
  getAccountByTestUserRef,
  getBtcWalletDescriptorByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  getInvoiceAttempt,
  getPhoneAndCodeFromRef,
  lndOutside1,
} from "test/helpers"

let serverPid: PID
let triggerPid: PID
let btcWalletDescriptor: WalletDescriptor<"BTC">
let usdWalletDescriptor: WalletDescriptor<"USD">
let walletIds: WalletId[]
let account: Account
let recipientBtcWalletDescriptor: WalletDescriptor<"BTC">
let recipientWalletIds: WalletId[]

let apolloClient: ApolloClient<NormalizedCacheObject>
let disposeClient: () => void = () => null

let recipientApolloClient: ApolloClient<NormalizedCacheObject>
let recipientDisposeClient: () => void = () => null

const userRef = "K"
const { phone, code } = getPhoneAndCodeFromRef(userRef)

const recipientUserRef = "L"
const { phone: recipientPhone, code: recipientCode } =
  getPhoneAndCodeFromRef(recipientUserRef)

beforeAll(async () => {
  await initializeTestingState(defaultStateConfig())
  serverPid = await startServer("start-main-ci")

  // Setup recipient
  ;({ apolloClient: recipientApolloClient, disposeClient: recipientDisposeClient } =
    await loginFromPhoneAndCode({
      phone: recipientPhone,
      code: recipientCode,
    }))
  recipientBtcWalletDescriptor = await getBtcWalletDescriptorByTestUserRef(
    recipientUserRef,
  )
  recipientWalletIds = [recipientBtcWalletDescriptor.id]

  // Setup sender
  ;({ apolloClient, disposeClient } = await loginFromPhoneAndCode({ phone, code }))

  account = await getAccountByTestUserRef(userRef)

  const usdWallet = await Accounts.addWalletIfNonexistent({
    accountId: account.id,
    type: WalletType.Checking,
    currency: WalletCurrency.Usd,
  })
  if (usdWallet instanceof Error) throw usdWallet
  usdWalletDescriptor = {
    id: usdWallet.id,
    accountId: account.id,
    currency: WalletCurrency.Usd,
  }

  const walletId = await getDefaultWalletIdByTestUserRef(userRef)
  btcWalletDescriptor = {
    id: walletId,
    accountId: account.id,
    currency: WalletCurrency.Btc,
  }

  walletIds = [btcWalletDescriptor.id, usdWalletDescriptor.id]

  await fundWalletIdFromLightning({
    walletId: btcWalletDescriptor.id,
    amount: 400_000,
  })

  await fundWalletIdFromLightning({
    walletId: usdWalletDescriptor.id,
    amount: 100_00,
  })

  triggerPid = await startServer("start-trigger-ci")
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
  await bitcoindSignerClient.unloadWallet({ walletName: "dev" })
  disposeClient()
  recipientDisposeClient()
  await killServer(serverPid)
  await killServer(triggerPid)
})

describe("sends a payment", () => {
  const satsAmount = 25_000
  const centsAmount = 1_00

  it("settles over lightning", async () => {
    // SEND PAYMENTS
    // ===============
    const uniqueHashesForEachSend: PaymentHash[] = []

    // OnChainPaymentSend

    const { request, id } = await createInvoice({
      lnd: lndOutside1,
      tokens: satsAmount,
    })
    const paymentRequest = request as EncodedPaymentRequest
    uniqueHashesForEachSend.push(id as PaymentHash)

    const input1 = {
      walletId: btcWalletDescriptor.id,
      paymentRequest,
    }
    const result1 = await apolloClient.mutate<LnInvoicePaymentSendMutation>({
      mutation: LnInvoicePaymentSendDocument,
      variables: { input: input1 },
    })
    const lnInvoicePaymentSend = result1?.data?.lnInvoicePaymentSend
    if (lnInvoicePaymentSend === undefined) {
      throw new Error("lnInvoicePaymentSend is undefined")
    }
    const { status: status1, errors: errors1 } = lnInvoicePaymentSend
    expect(errors1).toHaveLength(0)
    expect(status1).toBe("SUCCESS")

    const nTxns = 1
    expect(new Set(uniqueHashesForEachSend).size).toEqual(nTxns)

    // CHECK SETTLED STATUS
    // ===============
    for (const paymentHash of uniqueHashesForEachSend) {
      const invoice = await getInvoiceAttempt({ lnd: lndOutside1, id: paymentHash })
      if (invoice === null) throw new Error("invoice is null")
      expect(invoice.is_confirmed).toBe(true)
    }

    await apolloClient.resetStore()
    const response = await apolloClient.query<TransactionsQuery>({
      query: TransactionsDocument,
      variables: { walletIds, first: nTxns * 2 },
    })
    const txns = response.data?.me?.defaultAccount.transactions?.edges
    if (!txns) throw new Error("'txns' is falsy")

    const expectArraySends = uniqueHashesForEachSend.map((paymentHash) =>
      expect.objectContaining({
        node: expect.objectContaining({
          status: "SUCCESS",
          direction: "SEND",
          initiationVia: expect.objectContaining({
            paymentHash,
          }),
        }),
      }),
    )
    const expectArrayReimbursements = uniqueHashesForEachSend.map(() =>
      expect.objectContaining({
        node: expect.objectContaining({
          direction: "RECEIVE",
          initiationVia: expect.objectContaining({
            __typename: "InitiationViaIntraLedger",
          }),
        }),
      }),
    )
    expect(txns).toEqual(
      expect.arrayContaining([...expectArraySends, ...expectArrayReimbursements]),
    )

    const sendTxn = txns.find((tx) => tx.node.direction === "SEND")
    const reimburseTxn = txns.find((tx) => tx.node.direction === "RECEIVE")
    if (sendTxn === undefined || reimburseTxn === undefined) {
      throw new Error("Could not find expected txn")
    }
    expect(reimburseTxn.node.createdAt).toBeGreaterThanOrEqual(sendTxn.node.createdAt)
  })
})
