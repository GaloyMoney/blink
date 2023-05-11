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
  type: "utxo_detected"
  txId: OnChainTxHash
  vout: number
  satoshis: BtcPaymentAmount
  address: OnChainAddress
}
type UtxoSettled = {
  type: "utxo_settled"
  txId: OnChainTxHash
  vout: number
  satoshis: BtcPaymentAmount
  address: OnChainAddress
  blockNumber: number
}
type PaymentSubmitted = {
  type: "payout_submitted"
  id: string
}
type PaymentCommitted = {
  type: "payout_committed"
  id: string
}
type PaymentBroadcast = {
  type: "payout_broadcast"
  id: string
}
type PaymentSettled = {
  type: "payout_settled"
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
  payload: BriaPayload
  augmentation: BriaEventAugmentation
  sequence: BriaEventSequence
}

type BriaEventHandler = (event: BriaEvent) => Promise<true | ApplicationError>
