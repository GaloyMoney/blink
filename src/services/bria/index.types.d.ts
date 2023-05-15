type ClientReadableStream<T> = import("@grpc/grpc-js").ClientReadableStream<T>

type BriaPayloadType =
  typeof import("./index").BriaPayloadType[keyof typeof import("./index").BriaPayloadType]

type AddressAugmentation = {
  address: OnChainAddress
  externalId: string
}

type BriaEventAugmentation = {
  addressInfo?: AddressAugmentation
}

type UtxoDetected = {
  type: "utxo_detected"
  txId: OnChainTxHash
  vout: OnChainTxVout
  satoshis: BtcPaymentAmount
  address: OnChainAddress
}
type UtxoSettled = {
  type: "utxo_settled"
  txId: OnChainTxHash
  vout: OnChainTxVout
  satoshis: BtcPaymentAmount
  address: OnChainAddress
  blockNumber: number
}
type PayoutSubmitted = {
  type: "payout_submitted"
  id: string
  satoshis: BtcPaymentAmount
}
type PayoutCommitted = {
  type: "payout_committed"
  id: string
  satoshis: BtcPaymentAmount
}
type PayoutBroadcast = {
  type: "payout_broadcast"
  id: string
  satoshis: BtcPaymentAmount
}
type PayoutSettled = {
  type: "payout_settled"
  id: string
  satoshis: BtcPaymentAmount
}
type BriaPayload =
  | UtxoDetected
  | UtxoSettled
  | PayoutSubmitted
  | PayoutCommitted
  | PayoutBroadcast
  | PayoutSettled
type BriaEvent = {
  payload: BriaPayload
  augmentation: BriaEventAugmentation
  sequence: number
}

type BriaEventHandler = (event: BriaEvent) => Promise<true | ApplicationError>

type BriaErrorHandler = (err: Error) => void
