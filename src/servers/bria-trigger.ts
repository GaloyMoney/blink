import { Wallets } from "@app"
import { BriaPayloadType, BriaSubscriber } from "@services/bria"

export const briaEventHandler = async (
  event: BriaEvent,
): Promise<true | ApplicationError> => {
  switch (event.payload.type) {
    case BriaPayloadType.UtxoDetected: {
      return utxoDetectedEventHandler({ event: event.payload })
    }

    case BriaPayloadType.UtxoSettled: {
      return utxoSettledEventHandler({ event: event.payload })
    }
    default:
      return true
  }
}

const utxoDetectedEventHandler = async ({
  event,
}: {
  event: UtxoDetected
}): Promise<true | ApplicationError> => {
  return Wallets.addPendingTransaction(event)
}

const utxoSettledEventHandler = ({
  event,
}: {
  event: UtxoSettled
}): Promise<true | ApplicationError> => {
  return Wallets.addSettledTransaction(event)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const listenerBria = () => {
  const subBria = BriaSubscriber().subscribeToAll(briaEventHandler)
  if (subBria instanceof Error) throw subBria
}
