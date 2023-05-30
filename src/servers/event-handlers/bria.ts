import { Wallets } from "@app"

import { CouldNotFindWalletFromOnChainAddressError } from "@domain/errors"

import { BriaPayloadType } from "@services/bria"

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

export const utxoDetectedEventHandler = async ({
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

export const utxoSettledEventHandler = async ({
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
