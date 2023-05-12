import { Wallets } from "@app"

import { sat2btc, toSats } from "@domain/bitcoin"
import { UnknownRepositoryError } from "@domain/errors"

import { BriaSubscriber, BriaPayloadType } from "@services/bria"

import {
  bitcoindClient,
  bitcoindOutside,
  createMandatoryUsers,
  getDefaultWalletIdByTestUserRef,
  sendToAddressAndConfirm,
} from "test/helpers"

let walletIdA: WalletId

beforeAll(async () => {
  await createMandatoryUsers()

  await bitcoindClient.loadWallet({ filename: "outside" })

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
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

      let expectedTxId: string | Error = ""

      const receivedEvents: BriaEvent[] = []
      const nExpectedEvents = 2
      const testEventHandler = (resolver) => {
        return (event: BriaEvent): Promise<true | ApplicationError> => {
          receivedEvents.push(event)
          if (receivedEvents.length === nExpectedEvents) {
            resolver(receivedEvents)
          }
          return Promise.resolve(true)
        }
      }

      const timeout = 60000
      let listener
      const promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error(`Promise timed out after ${timeout} ms`))
        }, timeout)
        listener = bria.subscribeToAll(testEventHandler(resolve))
      })

      // Receive onchain
      const address = await Wallets.createOnChainAddressForBtcWallet(walletIdA)
      if (address instanceof Error) throw address
      expect(address.substring(0, 4)).toBe("bcrt")

      expectedTxId = await sendToAddressAndConfirm({
        walletClient: bitcoindOutside,
        address,
        amount: sat2btc(amountSats),
      })
      if (expectedTxId instanceof Error) throw expectedTxId

      const res = await promise
      if (res instanceof Error) throw res
      if (receivedEvents[0].payload.type != BriaPayloadType.UtxoDetected) {
        throw new Error("unexpected event type")
      }
      expect(receivedEvents[0].payload.txId).toEqual(expectedTxId)

      listener.on("error", () => {
        // supress error caused by cancel
      })
      listener.cancel()
    })

    it("re-subscribes", async () => {
      const amountSats = toSats(5_000)

      let expectedTxId: string | Error = ""

      const receivedEvents: BriaEvent[] = []
      const nExpectedEvents = 3
      const testEventHandler = (resolver) => {
        return (event: BriaEvent): Promise<true | ApplicationError> => {
          receivedEvents.push(event)
          if (receivedEvents.length == 2) {
            return Promise.reject(new UnknownRepositoryError())
          }
          if (receivedEvents.length === nExpectedEvents) {
            resolver(receivedEvents)
          }
          return Promise.resolve(true)
        }
      }

      const timeout = 60000
      let listener
      const promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error(`Promise timed out after ${timeout} ms`))
        }, timeout)
        listener = bria.subscribeToAll(testEventHandler(resolve))
      })

      // Receive onchain
      const address = await Wallets.createOnChainAddressForBtcWallet(walletIdA)
      if (address instanceof Error) throw address
      expect(address.substring(0, 4)).toBe("bcrt")

      expectedTxId = await sendToAddressAndConfirm({
        walletClient: bitcoindOutside,
        address,
        amount: sat2btc(amountSats),
      })
      if (expectedTxId instanceof Error) throw expectedTxId

      const res = await promise
      if (res instanceof Error) throw res
      expect(receivedEvents[1]).toEqual(receivedEvents[2])

      listener.on("error", () => {
        // supress error caused by cancel
      })
      listener.cancel()
    })
  })
})
