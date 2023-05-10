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
  blockNumber: number
}
type PaymentSubmitted = {
  id: string
}
type PaymentCommitted = {
  id: string
}
type PaymentBroadcast = {
  id: string
}
type PaymentSettled = {
  id: string
}
type BriaPayload =
  | UtxoDetected
  | UtxoSettled
  | PaymentSubmitted
  | PaymentCommitted
  | PaymentBroadcast
  | PaymentSettled
type BriaEvent = {
  payloadType: BriaPayloadType
  payload: BriaPayload
  augmentation: BriaEventAugmentation
  sequence: BriaEventSequence
}

type BriaEventHandler = (event: BriaEvent) => true | ApplicationError
