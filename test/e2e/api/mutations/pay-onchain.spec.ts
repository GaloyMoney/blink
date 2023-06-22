import { gql } from "apollo-server-core"

import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"

import { Accounts } from "@app/index"

import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"

import { BriaPayloadType } from "@services/bria"
import { BriaEventRepo } from "@services/bria/event-repository"
import { BriaEventModel } from "@services/bria/schema"
import { translateToLedgerTx } from "@services/ledger"
import { Transaction } from "@services/ledger/schema"

import { sleep, timeoutWithCancel } from "@utils"

import { loginFromPhoneAndCode } from "test/e2e/account-creation-e2e"
import {
  BalancesDocument,
  BalancesQuery,
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
  triggerPid = await startServer("start-trigger-ci")
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
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
  await bitcoindSignerClient.unloadWallet({ walletName: "dev" })
  disposeClient()
  await killServer(serverPid)
  await killServer(triggerPid)

  await sleep(2000)
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

  query balances {
    me {
      defaultAccount {
        wallets {
          id
          walletCurrency
          balance
        }
      }
    }
  }
`

describe("settles onchain", () => {
  const satsAmount = 25_000
  const centsAmount = 1_000

  it("sends a payment", async () => {
    const lastSequence = await BriaEventRepo().getLatestSequence()
    if (lastSequence instanceof Error) throw lastSequence

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

    // Wait for broadcast
    const nEvents = 4
    await waitForPaymentBroadcast({
      afterSequence: lastSequence,
      nEvents,
    })

    // CHECK PENDING STATUS
    // ===============

    const addresses = [
      onChainPaymentSendAddress,
      onChainUsdPaymentSendAsBtcDenominatedAddress,
      onChainUsdPaymentSendAddress,
      onChainPaymentSendAllAddress,
    ]
    expect(new Set(addresses).size).toEqual(nEvents)

    const { data: dataBefore } = await apolloClient.query<TransactionsQuery>({
      query: TransactionsDocument,
      variables: {
        walletIds,
        first: nEvents,
      },
    })
    const txnsBefore = dataBefore?.me?.defaultAccount.transactions?.edges
    expect(txnsBefore).toBeTruthy()

    const expectArrayBefore = addresses.map((address) =>
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

    // MINE AND CHECK SETTLED STATUS
    // ===============

    await mineAndSettlePayment(lastSequence)

    await apolloClient.resetStore()
    const { data: dataAfter } = await apolloClient.query<TransactionsQuery>({
      query: TransactionsDocument,
      variables: { walletIds, first: nEvents },
    })
    const txnsAfter = dataAfter?.me?.defaultAccount.transactions?.edges
    if (txnsAfter === undefined || txnsAfter === null) {
      throw new Error("txnsAfter is falsy")
    }

    const expectArrayAfter = addresses.map((address) =>
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

    const { data: balanceData } = await apolloClient.query<BalancesQuery>({
      query: BalancesDocument,
    })
    const wallets = balanceData?.me?.defaultAccount.wallets
    const usdBalance = wallets?.find((w) => w.walletCurrency === WalletCurrency.Usd)
    if (usdBalance === undefined) throw new Error()
    expect(usdBalance.balance).toEqual(0)

    const txIds = txnsAfter
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

const waitForEvent = async ({
  afterSequence,
  eventType,
}: {
  afterSequence: number
  eventType: BriaPayloadType
}): Promise<BriaEvent> => {
  return new Promise(async (resolve) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await BriaEventModel.findOne({
        "payload.type": eventType,
        "sequence": { $gt: afterSequence },
      })

      if (result !== null) {
        resolve(result)
        break
      }

      await sleep(1000)
    }
  })
}

const waitForPaymentBroadcast = async ({
  afterSequence,
  nEvents,
}: {
  afterSequence: number
  nEvents: number
}): Promise<BriaBroadcastEvent[]> => {
  const events: BriaBroadcastEvent[] = []
  while (events.length < nEvents) {
    const [timeoutPromise, cancelTimeout] = timeoutWithCancel(45_000, "Timeout")

    const eventPromise = await waitForEvent({
      afterSequence,
      eventType: BriaPayloadType.PayoutBroadcast,
    })
    const event = (await Promise.race([eventPromise, timeoutPromise])) as BriaEvent
    if (event instanceof Error) throw event

    if (event.payload.type !== BriaPayloadType.PayoutBroadcast) {
      throw new Error()
    }
    if (event.augmentation.payoutInfo === undefined) {
      throw new Error()
    }

    const broadcastEvent = {
      ...event,
      payload: event.payload,
      augmentation: {
        ...event.augmentation,
        payoutInfo: event.augmentation.payoutInfo,
      },
    }
    events.push(broadcastEvent)

    cancelTimeout()
  }

  return events
}

const mineAndSettlePayment = async (afterSequence: number) => {
  const [timeoutPromise, cancelTimeout] = timeoutWithCancel(45_000, "Timeout")

  await bitcoindOutside.generateToAddress({
    nblocks: 6,
    address: RANDOM_ADDRESS,
  })

  const settledEventPromise = await waitForEvent({
    afterSequence,
    eventType: BriaPayloadType.PayoutSettled,
  })
  const settledEvent = (await Promise.race([
    settledEventPromise,
    timeoutPromise,
  ])) as BriaEvent
  if (settledEvent instanceof Error) throw settledEvent

  if (settledEvent.payload.type !== BriaPayloadType.PayoutSettled) {
    throw new Error()
  }
  if (settledEvent.augmentation.payoutInfo === undefined) {
    throw new Error()
  }
  const {
    augmentation: {
      payoutInfo: { id: payoutId },
    },
  } = settledEvent

  const txnSettledPromise = waitForTransactionProps({
    payoutId,
    props: { pending: false },
  })
  const txnSettled = await Promise.race([txnSettledPromise, timeoutPromise])
  if (txnSettled instanceof Error) throw txnSettled
  cancelTimeout()

  return { payoutId }
}

const waitForTransactionProps = async ({
  payoutId,
  props,
}: {
  payoutId: PayoutId
  props: { pending?: boolean }
}): Promise<LedgerTransaction<WalletCurrency>> => {
  return new Promise(async (resolve) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await Transaction.findOne({ payout_id: payoutId, ...props })

      if (result !== null) {
        resolve(translateToLedgerTx(result))
        break
      }

      await sleep(1000)
    }
  })
}
