import { payOnChainByWalletIdForBtcWallet } from "@app/wallets"
import { getFeesConfig } from "@config"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import { PayoutSpeed } from "@domain/bitcoin/onchain"
import { BriaPayloadType } from "@services/bria"
import { BriaEventRepo } from "@services/bria/event-repository"
import { BriaEventModel } from "@services/bria/schema"
import { translateToLedgerTx } from "@services/ledger"
import { getTransactionsByPayoutId } from "@services/ledger/facade"
import { Transaction } from "@services/ledger/schema"
import { AccountsRepository } from "@services/mongoose"
import { sleep, timeoutWithCancel } from "@utils"

import {
  RANDOM_ADDRESS,
  bitcoindOutside,
  createRandomUserAndWallet,
  defaultStateConfig,
  fundWalletIdFromOnchainViaBria,
  initializeTestingState,
  killServer,
  startServer,
} from "test/helpers"

let serverPid: PID
let walletDescriptor: WalletDescriptor<"BTC">
let account: Account
let address: OnChainAddress

beforeAll(async () => {
  await initializeTestingState(defaultStateConfig())

  walletDescriptor = await createRandomUserAndWallet()
  const accountRes = await AccountsRepository().findById(walletDescriptor.accountId)
  if (accountRes instanceof Error) throw accountRes
  account = accountRes

  address = (await bitcoindOutside.getNewAddress()) as OnChainAddress

  await fundWalletIdFromOnchainViaBria({
    walletDescriptor,
    amountInBitcoin: 1.0,
  })

  serverPid = await startServer("start-trigger-ci")
})

afterAll(async () => {
  await killServer(serverPid)
})

const waitForPaymentBroadcast = async (
  afterSequence: number,
): Promise<{ payoutId: PayoutId; txId: OnChainTxHash }> => {
  const [timeoutPromise, cancelTimeout] = timeoutWithCancel(45_000, "Timeout")

  const broadcastEventPromise = await waitForEvent({
    afterSequence,
    eventType: BriaPayloadType.PayoutBroadcast,
  })
  const broadcastEvent = (await Promise.race([
    broadcastEventPromise,
    timeoutPromise,
  ])) as BriaEvent
  if (broadcastEvent instanceof Error) throw broadcastEvent
  cancelTimeout()

  if (broadcastEvent.payload.type !== BriaPayloadType.PayoutBroadcast) {
    throw new Error()
  }
  if (broadcastEvent.augmentation.payoutInfo === undefined) {
    throw new Error()
  }
  const {
    payload: { txId },
    augmentation: {
      payoutInfo: { id: payoutId },
    },
  } = broadcastEvent

  return { txId, payoutId }
}

const mineAndSettlePayment = async ({
  txId,
  afterSequence,
}: {
  txId: OnChainTxHash
  afterSequence: number
}) => {
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
    payload: { txId: txIdFromPayload },
    augmentation: {
      payoutInfo: { id: payoutId },
    },
  } = settledEvent
  if (txIdFromPayload !== txId) throw new Error()

  const txnSettledPromise = waitForTransactionProps({
    payoutId,
    props: { pending: false },
  })
  const txnSettled = await Promise.race([txnSettledPromise, timeoutPromise])
  if (txnSettled instanceof Error) throw txnSettled
  cancelTimeout()

  return { payoutId }
}

describe("settles onchain", () => {
  const satsAmount = 25_000

  it("sends a payment", async () => {
    const lastSequence = await BriaEventRepo().getLatestSequence()
    if (lastSequence instanceof Error) throw lastSequence

    const paid = await payOnChainByWalletIdForBtcWallet({
      senderWalletId: walletDescriptor.id,
      senderAccount: account,
      amount: satsAmount,
      address,
      speed: PayoutSpeed.Fast,
      memo: "",
    })
    if (paid instanceof Error) throw paid
    expect(paid.status).toEqual(PaymentSendStatus.Success)
    const { txId, payoutId } = await waitForPaymentBroadcast(lastSequence)

    const txnsBefore = await getTransactionsByPayoutId(payoutId)
    if (txnsBefore instanceof Error) throw txnsBefore
    const txnForWallet = txnsBefore.find((tx) => tx.walletId === walletDescriptor.id)
    if (txnForWallet === undefined) throw new Error()

    expect(txnForWallet.satsAmount).toEqual(satsAmount)
    expect(txnForWallet.satsFee).toBeGreaterThan(getFeesConfig().withdrawDefaultMin)
    expect(txnForWallet.txHash).toEqual(txId)
    expect(txnForWallet.pendingConfirmation).toBe(true)

    await mineAndSettlePayment({ afterSequence: lastSequence, txId })
  })
})

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
