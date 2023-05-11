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
      return utxoDetectedEventHandler(event.payload, addressInfo)

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
  addressInfo: AddressAugmentation,
): Promise<true | ApplicationError> => {
  const { seen, walletId } = addressInfo.metadata.galoy || {}
  if (seen && !walletId) {
    return true
  }

  const result = await Wallets.addPendingTransaction({
    walletId: addressInfo.metadata.galoy?.walletId,
    ...event,
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
  const { seen, walletId } = addressInfo.metadata.galoy || {}
  if (seen && !walletId) {
    return true
  }

  // Check if transaction recorded as yet
  const recorded = false
  if (recorded) {
    return
  }

  // Record ledger transaction
  Wallets.addSettledTransaction(event)
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
