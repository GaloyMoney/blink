import { gql } from "apollo-server-core"

import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"

import { Accounts } from "@app/index"

import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"

import { sleep, timeoutWithCancel } from "@utils"

import { loginFromPhoneAndCode } from "test/e2e/account-creation-e2e"
import {
  OnChainAddressCreateDocument,
  OnChainAddressCreateMutation,
  OnChainPaymentSendAllDocument,
  OnChainPaymentSendAllMutation,
  OnChainPaymentSendDocument,
  OnChainPaymentSendMutation,
  OnChainUsdPaymentSendAsBtcDenominatedDocument,
  OnChainUsdPaymentSendAsBtcDenominatedMutation,
  OnChainUsdPaymentSendDocument,
  OnChainUsdPaymentSendMutation,
  TransactionsDocument,
  TransactionsQuery,
} from "test/e2e/generated"

import {
  RANDOM_ADDRESS,
  bitcoindClient,
  bitcoindOutside,
  bitcoindSignerClient,
  checkIsBalanced,
  defaultStateConfig,
  fundWalletIdFromOnchainViaBria,
  getAccountByTestUserRef,
  getBtcWalletDescriptorByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  getPhoneAndCodeFromRef,
  initializeTestingState,
  killServer,
  startServer,
} from "test/helpers"
import { BitcoindWalletClient } from "test/helpers/bitcoind"

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

const getNewRecipientAddress = async () => {
  const addressResponse =
    await recipientApolloClient.mutate<OnChainAddressCreateMutation>({
      mutation: OnChainAddressCreateDocument,
      variables: { input: { walletId: recipientBtcWalletDescriptor.id } },
    })
  const address = addressResponse?.data?.onChainAddressCreate.address
  if (!address) {
    throw new Error("'address' is falsy")
  }
  return address as OnChainAddress
}

const getNewSenderBtcWalletAddress = async () => {
  const addressResponse = await apolloClient.mutate<OnChainAddressCreateMutation>({
    mutation: OnChainAddressCreateDocument,
    variables: { input: { walletId: btcWalletDescriptor.id } },
  })
  const address = addressResponse?.data?.onChainAddressCreate.address
  if (!address) {
    throw new Error("'address' is falsy")
  }
  return address as OnChainAddress
}

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

  await fundWalletIdFromOnchainViaBria({
    walletDescriptor: btcWalletDescriptor,
    amountInBitcoin: 1.0,
  })

  await fundWalletIdFromOnchainViaBria({
    walletDescriptor: usdWalletDescriptor,
    amountInBitcoin: 0.00_250_000,
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

gql`
  mutation onChainAddressCreate($input: OnChainAddressCreateInput!) {
    onChainAddressCreate(input: $input) {
      address
      errors {
        message
      }
    }
  }

  mutation onChainPaymentSend($input: OnChainPaymentSendInput!) {
    onChainPaymentSend(input: $input) {
      errors {
        message
      }
      status
    }
  }

  mutation onChainUsdPaymentSendAsBtcDenominated(
    $input: OnChainUsdPaymentSendAsBtcDenominatedInput!
  ) {
    onChainUsdPaymentSendAsBtcDenominated(input: $input) {
      errors {
        message
      }
      status
    }
  }

  mutation onChainUsdPaymentSend($input: OnChainUsdPaymentSendInput!) {
    onChainUsdPaymentSend(input: $input) {
      errors {
        message
      }
      status
    }
  }

  mutation onChainPaymentSendAll($input: OnChainPaymentSendAllInput!) {
    onChainPaymentSendAll(input: $input) {
      errors {
        message
      }
      status
    }
  }
`

describe("sends a payment", () => {
  const satsAmount = 25_000
  const centsAmount = 1_000

  it("settles trade intraccount", async () => {
    // SEND PAYMENTS
    // ===============
    const uniqueAddressesForEachSend: OnChainAddress[] = []

    // OnChainUsdPaymentSendAsBtcDenominated
    const onChainUsdPaymentSendAsBtcDenominatedAddress =
      await getNewSenderBtcWalletAddress()
    uniqueAddressesForEachSend.push(onChainUsdPaymentSendAsBtcDenominatedAddress)

    const input1 = {
      walletId: usdWalletDescriptor.id,
      address: onChainUsdPaymentSendAsBtcDenominatedAddress,
      amount: satsAmount,
    }
    const result1 =
      await apolloClient.mutate<OnChainUsdPaymentSendAsBtcDenominatedMutation>({
        mutation: OnChainUsdPaymentSendAsBtcDenominatedDocument,
        variables: { input: input1 },
      })
    const onChainUsdPaymentSendAsBtcDenominated =
      result1?.data?.onChainUsdPaymentSendAsBtcDenominated
    if (onChainUsdPaymentSendAsBtcDenominated === undefined) {
      throw new Error("onChainUsdPaymentSendAsBtcDenominated is undefined")
    }
    const { status: status1, errors: errors1 } = onChainUsdPaymentSendAsBtcDenominated
    expect(errors1).toHaveLength(0)
    expect(status1).toBe("SUCCESS")

    // OnChainUsdPaymentSend
    const onChainUsdPaymentSendAddress = await getNewSenderBtcWalletAddress()
    uniqueAddressesForEachSend.push(onChainUsdPaymentSendAddress)

    const input2 = {
      walletId: usdWalletDescriptor.id,
      address: onChainUsdPaymentSendAddress,
      amount: centsAmount,
    }
    const result2 = await apolloClient.mutate<OnChainUsdPaymentSendMutation>({
      mutation: OnChainUsdPaymentSendDocument,
      variables: { input: input2 },
    })
    const onChainUsdPaymentSend = result2?.data?.onChainUsdPaymentSend
    if (onChainUsdPaymentSend === undefined) {
      throw new Error("onChainUsdPaymentSend is undefined")
    }
    const { status: status2, errors: errors2 } = onChainUsdPaymentSend
    expect(errors2).toHaveLength(0)
    expect(status2).toBe("SUCCESS")

    const nTxns = 2
    expect(new Set(uniqueAddressesForEachSend).size).toEqual(nTxns)

    // CHECK TXNS
    // ===============

    await apolloClient.resetStore()
    const response = await apolloClient.query<TransactionsQuery>({
      query: TransactionsDocument,
      variables: { walletIds, first: nTxns * 2 },
    })
    const txns = response.data?.me?.defaultAccount.transactions?.edges
    if (!txns) throw new Error("'txns' is falsy")

    const expectSendArray = uniqueAddressesForEachSend.map((address) =>
      expect.objectContaining({
        node: expect.objectContaining({
          status: "SUCCESS",
          direction: "SEND",
          initiationVia: expect.objectContaining({
            address,
          }),
        }),
      }),
    )
    expect(txns).toEqual(expect.arrayContaining(expectSendArray))

    const expectReceiveArray = uniqueAddressesForEachSend.map((address) =>
      expect.objectContaining({
        node: expect.objectContaining({
          status: "SUCCESS",
          direction: "RECEIVE",
          initiationVia: expect.objectContaining({
            address,
          }),
        }),
      }),
    )
    expect(txns).toEqual(expect.arrayContaining(expectReceiveArray))
  })

  it("settles intraledger", async () => {
    // SEND PAYMENTS
    // ===============
    const uniqueAddressesForEachSend: OnChainAddress[] = []

    // OnChainPaymentSend
    const onChainPaymentSendAddress = await getNewRecipientAddress()
    uniqueAddressesForEachSend.push(onChainPaymentSendAddress)

    const input1 = {
      walletId: btcWalletDescriptor.id,
      address: onChainPaymentSendAddress,
      amount: satsAmount,
    }
    const result1 = await apolloClient.mutate<OnChainPaymentSendMutation>({
      mutation: OnChainPaymentSendDocument,
      variables: { input: input1 },
    })
    const onChainPaymentSend = result1?.data?.onChainPaymentSend
    if (onChainPaymentSend === undefined) {
      throw new Error("onChainPaymentSend is undefined")
    }
    const { status: status1, errors: errors1 } = onChainPaymentSend
    expect(errors1).toHaveLength(0)
    expect(status1).toBe("SUCCESS")

    // OnChainUsdPaymentSendAsBtcDenominated
    const onChainUsdPaymentSendAsBtcDenominatedAddress = await getNewRecipientAddress()
    uniqueAddressesForEachSend.push(onChainUsdPaymentSendAsBtcDenominatedAddress)

    const input2 = {
      walletId: usdWalletDescriptor.id,
      address: onChainUsdPaymentSendAsBtcDenominatedAddress,
      amount: satsAmount,
    }
    const result2 =
      await apolloClient.mutate<OnChainUsdPaymentSendAsBtcDenominatedMutation>({
        mutation: OnChainUsdPaymentSendAsBtcDenominatedDocument,
        variables: { input: input2 },
      })
    const onChainUsdPaymentSendAsBtcDenominated =
      result2?.data?.onChainUsdPaymentSendAsBtcDenominated
    if (onChainUsdPaymentSendAsBtcDenominated === undefined) {
      throw new Error("onChainUsdPaymentSendAsBtcDenominated is undefined")
    }
    const { status: status2, errors: errors2 } = onChainUsdPaymentSendAsBtcDenominated
    expect(errors2).toHaveLength(0)
    expect(status2).toBe("SUCCESS")

    // OnChainUsdPaymentSend
    const onChainUsdPaymentSendAddress = await getNewRecipientAddress()
    uniqueAddressesForEachSend.push(onChainUsdPaymentSendAddress)

    const input3 = {
      walletId: usdWalletDescriptor.id,
      address: onChainUsdPaymentSendAddress,
      amount: centsAmount,
    }
    const result3 = await apolloClient.mutate<OnChainUsdPaymentSendMutation>({
      mutation: OnChainUsdPaymentSendDocument,
      variables: { input: input3 },
    })
    const onChainUsdPaymentSend = result3?.data?.onChainUsdPaymentSend
    if (onChainUsdPaymentSend === undefined) {
      throw new Error("onChainUsdPaymentSend is undefined")
    }
    const { status: status3, errors: errors3 } = onChainUsdPaymentSend
    expect(errors3).toHaveLength(0)
    expect(status3).toBe("SUCCESS")

    const nTxns = 3
    expect(new Set(uniqueAddressesForEachSend).size).toEqual(nTxns)

    // CHECK TXNS
    // ===============
    const expectArray = uniqueAddressesForEachSend.map((address) =>
      expect.objectContaining({
        node: expect.objectContaining({
          status: "SUCCESS",
          initiationVia: expect.objectContaining({
            address,
          }),
        }),
      }),
    )

    // Check sender txns
    await apolloClient.resetStore()
    const response = await apolloClient.query<TransactionsQuery>({
      query: TransactionsDocument,
      variables: { walletIds, first: nTxns },
    })
    const txns = response.data?.me?.defaultAccount.transactions?.edges
    if (!txns) throw new Error("'txns' is falsy")
    expect(txns).toEqual(expect.arrayContaining(expectArray))

    // Check recipient txns
    await recipientApolloClient.resetStore()
    const responseRecipient = await recipientApolloClient.query<TransactionsQuery>({
      query: TransactionsDocument,
      variables: { walletIds: recipientWalletIds, first: nTxns },
    })
    const recipientTxns = responseRecipient.data?.me?.defaultAccount.transactions?.edges
    if (!recipientTxns) throw new Error("'recipientTxns' is falsy")
    expect(txns).toEqual(expect.arrayContaining(expectArray))
  })

  it("settles onchain", async () => {
    // SEND PAYMENTS
    // ===============

    // OnChainPaymentSend
    const onChainPaymentSendAddress =
      (await bitcoindOutside.getNewAddress()) as OnChainAddress

    const input1 = {
      walletId: btcWalletDescriptor.id,
      address: onChainPaymentSendAddress,
      amount: satsAmount,
    }
    const result1 = await apolloClient.mutate<OnChainPaymentSendMutation>({
      mutation: OnChainPaymentSendDocument,
      variables: { input: input1 },
    })
    const onChainPaymentSend = result1?.data?.onChainPaymentSend
    if (onChainPaymentSend === undefined) {
      throw new Error("onChainPaymentSend is undefined")
    }
    const { status: status1, errors: errors1 } = onChainPaymentSend
    expect(errors1).toHaveLength(0)
    expect(status1).toBe("SUCCESS")

    // OnChainUsdPaymentSendAsBtcDenominated
    const onChainUsdPaymentSendAsBtcDenominatedAddress =
      (await bitcoindOutside.getNewAddress()) as OnChainAddress

    const input2 = {
      walletId: usdWalletDescriptor.id,
      address: onChainUsdPaymentSendAsBtcDenominatedAddress,
      amount: satsAmount,
    }
    const result2 =
      await apolloClient.mutate<OnChainUsdPaymentSendAsBtcDenominatedMutation>({
        mutation: OnChainUsdPaymentSendAsBtcDenominatedDocument,
        variables: { input: input2 },
      })
    const onChainUsdPaymentSendAsBtcDenominated =
      result2?.data?.onChainUsdPaymentSendAsBtcDenominated
    if (onChainUsdPaymentSendAsBtcDenominated === undefined) {
      throw new Error("onChainUsdPaymentSendAsBtcDenominated is undefined")
    }
    const { status: status2, errors: errors2 } = onChainUsdPaymentSendAsBtcDenominated
    expect(errors2).toHaveLength(0)
    expect(status2).toBe("SUCCESS")

    // OnChainUsdPaymentSend
    const onChainUsdPaymentSendAddress =
      (await bitcoindOutside.getNewAddress()) as OnChainAddress

    const input3 = {
      walletId: usdWalletDescriptor.id,
      address: onChainUsdPaymentSendAddress,
      amount: centsAmount,
    }
    const result3 = await apolloClient.mutate<OnChainUsdPaymentSendMutation>({
      mutation: OnChainUsdPaymentSendDocument,
      variables: { input: input3 },
    })
    const onChainUsdPaymentSend = result3?.data?.onChainUsdPaymentSend
    if (onChainUsdPaymentSend === undefined) {
      throw new Error("onChainUsdPaymentSend is undefined")
    }
    const { status: status3, errors: errors3 } = onChainUsdPaymentSend
    expect(errors3).toHaveLength(0)
    expect(status3).toBe("SUCCESS")

    // OnChainPaymentSendAll
    const onChainPaymentSendAllAddress =
      (await bitcoindOutside.getNewAddress()) as OnChainAddress

    const input4 = {
      walletId: usdWalletDescriptor.id,
      address: onChainPaymentSendAllAddress,
    }
    const result4 = await apolloClient.mutate<OnChainPaymentSendAllMutation>({
      mutation: OnChainPaymentSendAllDocument,
      variables: { input: input4 },
    })
    const onChainPaymentSendAll = result4?.data?.onChainPaymentSendAll
    if (onChainPaymentSendAll === undefined) {
      throw new Error("onChainUsdPaymentSend is undefined")
    }
    const { status: status4, errors: errors4 } = onChainPaymentSendAll
    expect(errors4).toHaveLength(0)
    expect(status4).toBe("SUCCESS")

    const nTxns = 4

    // Wait for broadcast, where txId exists in txn
    const txnsBefore = await waitForTransactions({
      nTxns,
      isPending: true,
    })

    // CHECK PENDING STATUS
    // ===============

    const uniqueAddressesForEachSend = [
      onChainPaymentSendAddress,
      onChainUsdPaymentSendAsBtcDenominatedAddress,
      onChainUsdPaymentSendAddress,
      // onChainPaymentSendAllAddress,
    ]
    const expectArrayBefore = uniqueAddressesForEachSend.map((address) =>
      expect.objectContaining({
        node: expect.objectContaining({
          status: "PENDING",
          initiationVia: expect.objectContaining({
            address,
          }),
        }),
      }),
    )
    expect(txnsBefore).toEqual(expect.arrayContaining(expectArrayBefore))

    const txIds = txnsBefore
      .map(
        (tx) =>
          tx.node.settlementVia.__typename === "SettlementViaOnChain" &&
          (tx.node.settlementVia.transactionHash as OnChainTxHash),
      )
      .filter((hash): hash is OnChainTxHash => !!hash)
    const uniqueTxIds = Array.from(new Set(txIds))
    const txnsFromBitcoind = await Promise.all(
      uniqueTxIds.map((txId) =>
        safeGetTransaction({
          bitcoind: bitcoindOutside,
          txid: txId,
          include_watchonly: false,
        }),
      ),
    )
    expect(txnsFromBitcoind).not.toContain(undefined)

    // MINE AND CHECK SETTLED STATUS
    // ===============

    await bitcoindOutside.generateToAddress({
      nblocks: 6,
      address: RANDOM_ADDRESS,
    })

    const txnsAfter = await waitForTransactions({
      nTxns,
      isPending: false,
    })

    const expectArrayAfter = uniqueAddressesForEachSend.map((address) =>
      expect.objectContaining({
        node: expect.objectContaining({
          status: "SUCCESS",
          initiationVia: expect.objectContaining({
            address,
          }),
        }),
      }),
    )
    expect(txnsAfter).toEqual(expect.arrayContaining(expectArrayAfter))
  })
})

const safeGetTransaction = async ({
  bitcoind,
  txid,
  include_watchonly,
}: {
  bitcoind: BitcoindWalletClient
  txid: string
  include_watchonly?: boolean | undefined
}) => {
  try {
    return bitcoind.getTransaction({ txid, include_watchonly })
  } catch (err) {
    return undefined
  }
}

type me = Exclude<TransactionsQuery["me"], null | undefined>
type transactions = Exclude<me["defaultAccount"]["transactions"], null | undefined>
type edges = Exclude<transactions["edges"], null | undefined>

const waitForTransactions = async ({
  nTxns,
  isPending,
}: {
  nTxns: number
  isPending: boolean
}): Promise<edges> => {
  const gqlTxnPromise: Promise<edges> = new Promise(async (resolve) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await apolloClient.resetStore()
      const response = await apolloClient.query<TransactionsQuery>({
        query: TransactionsDocument,
        variables: { walletIds, first: nTxns },
      })
      const txns = response.data?.me?.defaultAccount.transactions?.edges
      if (!txns) break

      const statusSet = new Set(txns.map((tx) => tx.node.status))
      const txIds = txns.map(
        (tx) =>
          tx.node.settlementVia.__typename === "SettlementViaOnChain" &&
          tx.node.settlementVia.transactionHash,
      )

      if (
        statusSet.size === 1 &&
        statusSet.has(isPending ? "PENDING" : "SUCCESS") &&
        txIds.every(Boolean)
      ) {
        resolve(txns)
        break
      }

      await sleep(1000)
    }
  })

  const [timeoutPromise, cancelTimeout] = timeoutWithCancel(30_000, "Timeout")
  const gqlTxn = await Promise.race([gqlTxnPromise, timeoutPromise])
  if (gqlTxn instanceof Error) throw gqlTxn
  if (!gqlTxn) throw new Error("Should not be reached because timeout always throws")
  cancelTimeout()

  return gqlTxn
}
