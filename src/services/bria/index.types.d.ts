type BriaEventSequence = number & { readonly brand: unique symbol }

type ClientReadableStream<T> = import("@grpc/grpc-js").ClientReadableStream<T>

type BriaPayloadType =
  typeof import("./index").BriaPayloadType[keyof typeof import("./index").BriaPayloadType]

type AddressAugmentation = {
  address: OnChainAddress
  externalId: string
  metadata: any
}

type BriaEventAugmentation = {
  addressInfo?: AddressAugmentation
}

type UtxoDetected = {
  txId: OnChainTxHash
  vout: number
  satoshis: BtcPaymentAmount
  address: OnChainAddress
}
type UtxoSettled = {
  txId: OnChainTxHash
  vout: number
  satoshis: BtcPaymentAmount
  address: OnChainAddress
}
type BriaPayload = UtxoDetected | UtxoSettled
type BriaEvent = {
  payloadType: BriaPayloadType
  payload: BriaPayload
  augmentation: BriaEventAugmentation
  sequence: BriaEventSequence
}

type BriaEventHandler = (event: BriaEvent) => true | ApplicationError
