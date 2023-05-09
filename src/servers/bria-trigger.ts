// import { InvalidBriaEventError } from "@domain/bitcoin/onchain"

import { BriaPayloadType } from "@services/bria-api"

export const briaEventHandler = (event: BriaEvent) => {
  if (!event.augmentation) {
    //error - resubscribe
    return
  }
  let result: any = null
  switch (event.payloadType) {
    case BriaPayloadType.UtxoDetected:
      const addressInfo = event.augmentation.addressInfo
      if (!addressInfo) {
        // error resubscribe
        return
      }
      const payload = event.payload as UtxoDetected
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
  // Wallets.addPendingTransaction({ userId: addressInfo.metadata.galoy.userId, seen: addressInfo.metadata.galoy.seen, txHash: event.txId, vout: event.vout, amount: event.satoshis,})
  const seenByGaloy = addressInfo.metadata.seenByGaloyBackend!
  let userId: UserId | undefined
  if (!seenByGaloy) {
    // const userId = Wallets.lookupUserIdForAddress(addressInfo.address)
    userId = "result" as UserId
    // BriaService.updateAddressMetadata({address, userId})
    // BriaService.getNewAddress({address, userId})
  } else {
    userId = addressInfo.metadata.galoyUserId
  }
  if (!userId) {
    return
  }
  // Add event to pending transactions collection
  if (userId) {
    // Wallets.addPendingTransaction({ userId: null, txHash: event.txId, vout: event.vout, amount: event.satoshis,})
  }
}

// export const utxoSettledEventHandler = (event: UtxoSettledEvent) => {
//   // Remove txn from pending transactions collection
//   // Record ledger transaction
//   event
// }
