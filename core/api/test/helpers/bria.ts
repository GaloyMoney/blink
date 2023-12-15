import {
  RANDOM_ADDRESS,
  bitcoindClient,
  bitcoindOutside,
  bitcoindSignerClient,
  bitcoindSignerWallet,
} from "./bitcoin-core"

import { waitFor, waitForNoErrorWithCount } from "./shared"

import { BriaSubscriber, OnChainService } from "@/services/bria"
import { baseLogger } from "@/services/logger"

export const getBriaBalance = async (): Promise<Satoshis> => {
  const service = OnChainService()
  const hot = await service.getHotBalance()
  if (hot instanceof Error) throw hot
  // Cold wallet is not initialized in JS tests
  // const cold = await service.getColdBalance()
  // if (cold instanceof Error) throw cold
  return Number(hot.amount) as Satoshis
}

export const onceBriaSubscribe = async ({
  type,
  txId,
  payoutId,
}: {
  type: BriaPayloadType
  txId?: OnChainTxHash
  payoutId?: PayoutId
}): Promise<BriaEvent | undefined> => {
  const bria = BriaSubscriber()

  let eventToReturn: BriaEvent | undefined = undefined

  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  const eventHandler = ({ resolve, timeoutId }) => {
    return async (event: BriaEvent): Promise<true | ApplicationError> => {
      setTimeout(() => {
        if (
          event.payload.type === type &&
          (!txId || ("txId" in event.payload && event.payload.txId === txId)) &&
          (!payoutId || ("id" in event.payload && event.payload.id === payoutId))
        ) {
          eventToReturn = event
          resolve(event)
          clearTimeout(timeoutId)
        }
      }, 1)
      return Promise.resolve(true)
    }
  }

  const timeout = 20_000
  let wrapper
  const promise = new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Promise timed out after ${timeout} ms`))
    }, timeout)
    wrapper = await bria.subscribeToAll(eventHandler({ resolve, timeoutId }))
  })

  const res = await promise
  if (res instanceof Error) throw res

  // @ts-ignore-next-line no-implicit-any error
  wrapper.cancel()
  return eventToReturn
}

export const manyBriaSubscribe = async ({
  type,
  addresses,
}: {
  type: BriaPayloadType
  addresses: OnChainAddress[]
}): Promise<BriaEvent[]> => {
  const bria = BriaSubscriber()

  const eventsToReturn: BriaEvent[] = []

  // @ts-ignore-next-line no-implicit-any error
  const eventHandler = ({ resolve, timeoutId }) => {
    return async (event: BriaEvent): Promise<true | ApplicationError> => {
      setTimeout(() => {
        if (
          event.payload.type === type &&
          "address" in event.payload &&
          addresses.includes(event.payload.address)
        ) {
          eventsToReturn.push(event)

          if (eventsToReturn.length === addresses.length) {
            resolve(eventsToReturn)
            clearTimeout(timeoutId)
          }
        }
      }, 1)
      return Promise.resolve(true)
    }
  }

  const timeout = 20_000
  let wrapper
  const promise = new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Promise timed out after ${timeout} ms`))
    }, timeout)
    wrapper = await bria.subscribeToAll(eventHandler({ resolve, timeoutId }))
  })

  const res = await promise
  if (res instanceof Error) throw res

  // @ts-ignore-next-line no-implicit-any error
  wrapper.cancel()
  return eventsToReturn
}

export const resetBria = async () => {
  const block = await bitcoindClient.getBlockCount()
  if (!block) return // skip if we are just getting started

  const existingSignerWallets = await bitcoindSignerClient.listWalletDir()
  if (!existingSignerWallets.map((wallet) => wallet.name).includes("dev")) {
    return
  }

  const balance = await bitcoindSignerWallet.getBalance()
  if (balance === 0) return

  await bitcoindSignerWallet.sendToAddress({
    address: RANDOM_ADDRESS,
    amount: balance,
    subtractfeefromamount: true,
  })
  await bitcoindOutside.generateToAddress({ nblocks: 3, address: RANDOM_ADDRESS })

  await waitUntilBriaZeroBalance()
}

const waitUntilBriaZeroBalance = async () => {
  await waitFor(async () => {
    const balanceAmount = await OnChainService().getHotBalance()
    if (balanceAmount instanceof Error) throw balanceAmount
    const balance = Number(balanceAmount.amount)

    if (balance > 0) {
      baseLogger.warn({ briaBalance: `${balance} sats` }, "bria balance not zero yet")
      return false
    }

    return true
  })
}

export const waitUntilBriaConnected = async () => {
  // @ts-ignore-next-line no-implicit-any error
  const balance = await waitForNoErrorWithCount(OnChainService().getHotBalance, 60)
  if (balance instanceof Error) throw balance
}
