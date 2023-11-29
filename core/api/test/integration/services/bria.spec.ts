import { Wallets } from "@/app"

import { sat2btc, toSats } from "@/domain/bitcoin"
import { UnknownRepositoryError } from "@/domain/errors"
import { utxoSettledEventHandler } from "@/servers/event-handlers/bria"

import { BriaSubscriber, BriaPayloadType } from "@/services/bria"
import { GrpcStreamClient, timeoutWithCancel } from "@/utils"

import {
  bitcoindClient,
  bitcoindOutside,
  createMandatoryUsers,
  createUserAndWalletFromPhone,
  getDefaultWalletIdByPhone,
  mineAndConfirm,
  randomPhone,
  sendToAddressAndConfirm,
} from "test/helpers"
import { BitcoindWalletClient } from "test/helpers/bitcoind"

let walletIdA: WalletId

const TIMEOUT_BRIA_EVENT = 60_000

const phone = randomPhone()

const loadBitcoindWallet = async (walletName: string) => {
  const wallets = await bitcoindClient.listWallets()
  if (!wallets.includes(walletName)) {
    try {
      await bitcoindClient.createWallet({ walletName })
    } catch (err) {
      const error = err as Error
      if (error.message.includes("Database already exists")) {
        await bitcoindClient.loadWallet({ filename: walletName })
      }
    }
  }
}

const fundOutsideOnChainWallet = async () => {
  // Setup outside bitcoind
  const walletName = "outside"
  const bitcoindOutside = new BitcoindWalletClient(walletName)

  // Fund outside bitcoind
  const numOfBlocks = 10
  const bitcoindAddress = await bitcoindOutside.getNewAddress()
  await mineAndConfirm({
    walletClient: bitcoindOutside,
    numOfBlocks,
    address: bitcoindAddress,
  })
}

beforeAll(async () => {
  await createMandatoryUsers()

  await loadBitcoindWallet("outside")
  await fundOutsideOnChainWallet()

  await createUserAndWalletFromPhone(phone)
  walletIdA = await getDefaultWalletIdByPhone(phone)
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
      const address = await Wallets.createOnChainAddress({
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
      /* eslint @typescript-eslint/ban-ts-comment: "off" */
      // @ts-ignore-next-line no-implicit-any error
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

      // @ts-ignore-next-line no-implicit-any error
      wrapper.cancel()
    })

    it("re-subscribes", async () => {
      const amountSats = toSats(5_000)

      // Receive onchain
      const address = await Wallets.createOnChainAddress({
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
      // @ts-ignore-next-line no-implicit-any error
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

      // @ts-ignore-next-line no-implicit-any error
      wrapper.cancel()
    })
  })
})
