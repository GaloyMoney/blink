import { BriaSubscriber, NewOnChainService } from "@services/bria"

export const getBriaBalance = async (): Promise<Satoshis> => {
  const service = NewOnChainService()
  const response = await service.getBalance()
  if (response instanceof Error) throw response
  return Number(response.amount) as Satoshis
}

export const onceBriaSubscribe = async ({
  type,
  txId,
}: {
  type: BriaPayloadType
  txId: OnChainTxHash
}): Promise<BriaEvent | undefined> => {
  const bria = BriaSubscriber()

  let eventToReturn: BriaEvent | undefined = undefined
  const eventHandler = ({ resolve, timeoutId }) => {
    return async (event: BriaEvent): Promise<true | ApplicationError> => {
      setTimeout(() => {
        if (
          event.payload.type === type &&
          "txId" in event.payload &&
          event.payload.txId === txId
        ) {
          eventToReturn = event
          resolve(event)
          clearTimeout(timeoutId)
        }
      }, 1)
      return Promise.resolve(true)
    }
  }

  const timeout = 30_000
  let wrapper
  const promise = new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Promise timed out after ${timeout} ms`))
    }, timeout)
    wrapper = await bria.subscribeToAll(eventHandler({ resolve, timeoutId }))
  })

  const res = await promise
  if (res instanceof Error) throw res

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

  const timeout = 30_000
  let wrapper
  const promise = new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Promise timed out after ${timeout} ms`))
    }, timeout)
    wrapper = await bria.subscribeToAll(eventHandler({ resolve, timeoutId }))
  })

  const res = await promise
  if (res instanceof Error) throw res

  wrapper.cancel()
  return eventsToReturn
}
