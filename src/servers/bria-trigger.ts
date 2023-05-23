import { Wallets } from "@app"
import { CouldNotFindWalletFromOnChainAddressError } from "@domain/errors"
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
  const res = await Wallets.addPendingTransaction(event)
  if (res instanceof CouldNotFindWalletFromOnChainAddressError) {
    return true
  }

  return res
}

const utxoSettledEventHandler = async ({
  event,
}: {
  event: UtxoSettled
}): Promise<true | ApplicationError> => {
  const res = await Wallets.addSettledTransaction(event)
  if (res instanceof CouldNotFindWalletFromOnChainAddressError) {
    return true
  }

  return res
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const listenerBria = () => {
  const subBria = BriaSubscriber().subscribeToAll(briaEventHandler)
  if (subBria instanceof Error) throw subBria
}
