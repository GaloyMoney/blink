// import { InvalidBriaEventError } from "@domain/bitcoin/onchain"

import { Wallets } from "@app"
import { BriaPayloadType } from "@services/bria-api"

export const briaEventHandler = (event: BriaEvent) => {
  if (!event.augmentation) {
    //error - resubscribe
    return
  }
  let result: any = null
  let addressInfo, payload
  switch (event.payloadType) {
    case BriaPayloadType.UtxoDetected:
      addressInfo = event.augmentation.addressInfo
      if (!addressInfo) {
        // error resubscribe
        return
      }
      payload = event.payload as UtxoDetected
      result = utxoDetectedEventHandler(payload, addressInfo)
  }

  if (result) {
    // persist sequence
  }
}

export const utxoDetectedEventHandler = (
  event: UtxoDetected,
  addressInfo: AddressAugmentation,
) => {
  const { seenByGaloy, userId } = addressInfo.metadata
  if (seenByGaloy && userId === undefined) {
    return // Error
  }
  Wallets.addPendingTransaction({
    rawUserId: userId,
    txHash: event.txId,
    vout: event.vout,
    amount: event.satoshis,
  })
}

// export const utxoSettledEventHandler = (event: UtxoSettledEvent) => {
//   // Remove txn from pending transactions collection
//   // Record ledger transaction
//   event
// }
