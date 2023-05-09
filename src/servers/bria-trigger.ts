import { InvalidBriaEventError } from "@domain/bitcoin/onchain"

import { BriaPayloadType } from "@services/bria-api"

export const briaEventHandler = (event: BriaEvent) => {
  switch (event.payload) {
    case BriaPayloadType.UtxoDetected:
      return utxoDetectedEventHandler(event)
    case BriaPayloadType.UtxoSettled:
      return utxoSettledEventHandler(event)
    default:
      return new InvalidBriaEventError((event as BriaEvent).payload)
  }
}

export const utxoDetectedEventHandler = (event: UtxoDetectedEvent) => {
  // Add event to pending transactions collection
  event
}

export const utxoSettledEventHandler = (event: UtxoSettledEvent) => {
  // Remove txn from pending transactions collection
  // Record ledger transaction
  event
}
