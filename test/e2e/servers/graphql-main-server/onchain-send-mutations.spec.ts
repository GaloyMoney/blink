import { gql } from "apollo-server-core"

import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"

import { Accounts } from "@app/index"

import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"

import { sleep, timeoutWithCancel } from "@utils"

import { loginFromPhoneAndCode } from "test/e2e/account-creation-e2e"
import {
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

let apolloClient: ApolloClient<NormalizedCacheObject>
let disposeClient: () => void = () => null

const userRef = "K"
const { phone, code } = getPhoneAndCodeFromRef(userRef)

beforeAll(async () => {
  await initializeTestingState(defaultStateConfig())
  serverPid = await startServer("start-main-ci")
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
  await killServer(serverPid)
  await killServer(triggerPid)
})

gql`
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

describe("settles onchain", () => {
  const satsAmount = 25_000
  const centsAmount = 1_000

  it("sends a payment", async () => {
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
      onChainPaymentSendAllAddress,
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
