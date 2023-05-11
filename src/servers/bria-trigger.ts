// import { InvalidBriaEventError } from "@domain/bitcoin/onchain"

import { Wallets } from "@app"
import { BriaPayloadType, BriaSubscriber } from "@services/bria"

export const briaEventHandler = async (
  event: BriaEvent,
): Promise<true | ApplicationError> => {
  if (!event.augmentation) {
    //error - resubscribe
    return new Error("augmentation missing")
  }
  let result: true | undefined = undefined
  const addressInfo = event.augmentation.addressInfo
  switch (event.payload.type) {
    case BriaPayloadType.UtxoDetected:
      if (!addressInfo) {
        // error resubscribe
        return new Error("addressInfo missing")
      }
      return utxoDetectedEventHandler(event.payload)

    case BriaPayloadType.UtxoSettled:
      if (!addressInfo) {
        // error resubscribe
        return new Error("addressInfo missing")
      }
      result = utxoSettledEventHandler({
        event: event.payload,
        addressInfo,
      })
  }

  if (result) {
    // persist sequence
  }

  return true
}

const utxoDetectedEventHandler = async (
  event: UtxoDetected,
): Promise<true | ApplicationError> => {
  // Note: I'm thinking to skip the 'seenByGaloy' logic here if we
  //       are only persisting bitcoin-related data only and multiple
  //       persists on same object shouldn't happen often (at all?),
  //       and don't matter if they do(?).
  const result = await Wallets.addPendingTransaction({
    address: event.address,
    txHash: event.txId,
    vout: event.vout,
    amount: event.satoshis,
  })

  return result instanceof Error ? result : true
}

const utxoSettledEventHandler = ({
  event,
  addressInfo,
}: {
  event: UtxoSettled
  addressInfo: AddressAugmentation
}) => {
  const { seenByGaloy, userId } = addressInfo.metadata
  if (seenByGaloy && userId === undefined) {
    return true
  }

  // Check if transaction recorded as yet
  const recorded = false
  if (recorded) {
    return
  }

  // Record ledger transaction
  Wallets.addSettledTransaction({
    address: event.address,
    txHash: event.txId,
    vout: event.vout,
    amount: event.satoshis,
    blockNumber: event.blockNumber,
  })

  // Remove txn from pending transactions collection
}

const listenerBria = () => {
  const subBria = BriaSubscriber().subscribeToAll(briaEventHandler)
  if (subBria instanceof Error) throw subBria
}

const main = () => {
  listenerBria()

  console.log("Bria trigger server ready")
}

// only execute if it is the main module
if (require.main === module) {
  main()
  // healthCheck()
  // setupMongoConnection()
  // .then(main)
  // .catch((err) => logger.error(err))
}
