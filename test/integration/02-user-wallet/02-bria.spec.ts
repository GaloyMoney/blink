import { Wallets } from "@app"

import { sat2btc, toSats } from "@domain/bitcoin"
import { UnknownRepositoryError } from "@domain/errors"
import { utxoSettledEventHandler } from "@servers/event-handlers/bria"

import { BriaSubscriber, BriaPayloadType } from "@services/bria"
import { GrpcStreamClient, timeoutWithCancel } from "@utils"

import {
  bitcoindClient,
  bitcoindOutside,
  checkIsBalanced,
  createMandatoryUsers,
  getDefaultWalletIdByTestUserRef,
  sendToAddressAndConfirm,
} from "test/helpers"

let walletIdA: WalletId

const TIMEOUT_BRIA_EVENT = 60_000

beforeAll(async () => {
  await createMandatoryUsers()

  await bitcoindClient.loadWallet({ filename: "outside" })

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

describe("BriaSubscriber", () => {
  const bria = BriaSubscriber()

  describe("subscribeToAll", () => {
    it("receives utxo events", async () => {
      const amountSats = toSats(5_000)
      // Receive onchain
      const address = await Wallets.createOnChainAddressForBtcWallet({
        walletId: walletIdA,
      })
      if (address instanceof Error) throw address
      expect(address.substring(0, 4)).toBe("bcrt")

      let expectedTxId: string | Error = ""
      expectedTxId = await sendToAddressAndConfirm({
        walletClient: bitcoindOutside,
        address,
        amount: sat2btc(amountSats),
      })
      if (expectedTxId instanceof Error) throw expectedTxId

      const receivedEvents: BriaEvent[] = []
      const nExpectedEvents = 2
      let recording = false
      const testEventHandler = (resolve) => {
        return async (event: BriaEvent): Promise<true | ApplicationError> => {
          if (
            event.payload.type === BriaPayloadType.UtxoDetected &&
            event.payload.txId === expectedTxId
          ) {
            recording = true
          }
          // required to avoid checkIsBalanced error
          if (event.payload.type === BriaPayloadType.UtxoSettled) {
            await utxoSettledEventHandler({ event: event.payload })
          }

          if (recording) {
            receivedEvents.push(event)
            if (receivedEvents.length === nExpectedEvents) {
              setTimeout(() => {
                resolve(receivedEvents)
              }, 1)
            }
          }
          return Promise.resolve(true)
        }
      }

      const [timeoutPromise, cancelTimeoutFn] = timeoutWithCancel(
        TIMEOUT_BRIA_EVENT,
        "Timeout",
      )

      let wrapper
      const eventPromise = new Promise(async (resolve) => {
        wrapper = await bria.subscribeToAll(testEventHandler(resolve))
      })

      const res = await Promise.race([eventPromise, timeoutPromise])
      if (res instanceof Error) throw res
      cancelTimeoutFn()

      if (receivedEvents[0].payload.type != BriaPayloadType.UtxoDetected) {
        throw new Error("unexpected event type")
      }
      expect(receivedEvents[0].payload.txId).toEqual(expectedTxId)

      wrapper.cancel()
    })

    it("re-subscribes", async () => {
      const amountSats = toSats(5_000)

      // Receive onchain
      const address = await Wallets.createOnChainAddressForBtcWallet({
        walletId: walletIdA,
      })
      if (address instanceof Error) throw address
      expect(address.substring(0, 4)).toBe("bcrt")

      const expectedTxId = await sendToAddressAndConfirm({
        walletClient: bitcoindOutside,
        address,
        amount: sat2btc(amountSats),
      })
      if (expectedTxId instanceof Error) throw expectedTxId

      let recording = false
      const receivedEvents: BriaEvent[] = []
      const nExpectedEvents = 3
      const testEventHandler = (resolve) => {
        return async (event: BriaEvent): Promise<true | ApplicationError> => {
          if (
            event.payload.type === BriaPayloadType.UtxoDetected &&
            event.payload.txId === expectedTxId
          ) {
            recording = true
          }

          // required to avoid checkIsBalanced error
          if (event.payload.type === BriaPayloadType.UtxoSettled) {
            await utxoSettledEventHandler({ event: event.payload })
          }

          if (recording) {
            receivedEvents.push(event)
          }

          if (receivedEvents.length == 2) {
            return new UnknownRepositoryError()
          }
          if (receivedEvents.length === nExpectedEvents) {
            setTimeout(() => {
              resolve(receivedEvents)
            }, 1)
          }
          return Promise.resolve(true)
        }
      }

      const [timeoutPromise, cancelTimeoutFn] = timeoutWithCancel(
        TIMEOUT_BRIA_EVENT,
        "Timeout",
      )

      let wrapper
      const eventPromise = new Promise(async (resolve) => {
        const stream = await bria.subscribeToAll(testEventHandler(resolve))
        if (stream instanceof Error) throw stream
        stream.backoff = new GrpcStreamClient.FibonacciBackoff(100, 1)
        wrapper = stream
      })

      const res = await Promise.race([eventPromise, timeoutPromise])
      if (res instanceof Error) throw res
      cancelTimeoutFn()

      expect(receivedEvents[1]).toEqual(receivedEvents[2])

      wrapper.cancel()
    })
  })
})
