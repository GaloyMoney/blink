type ClientReadableStream<T> = import("@grpc/grpc-js").ClientReadableStream<T>
type ListenerWrapper<T> = {
  listener: ClientReadableStream<T>
}

type BriaPayloadType =
  typeof import("./index").BriaPayloadType[keyof typeof import("./index").BriaPayloadType]

type AddressAugmentation = {
  address: OnChainAddress
  externalId: string
}

interface UtxoSettledEvent extends OnChainEvent {
  payload: Extract<BriaPayloadType, "utxo_settled">
  utxo_settled: {
    wallet_id: WalletId
    tx_id: OnChainTxHash
    vout: OnChainTxVout
    satoshis: string
    address: OnChainAddress
    block_height: number
    block_time: string
  }
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
type PayoutSubmitted = {
  type: "payout_submitted"
  id: string
}
type PayoutCommitted = {
  type: "payout_committed"
  id: string
}
type PayoutBroadcast = {
  type: "payout_broadcast"
  id: string
}
type PayoutSettled = {
  type: "payout_settled"
  id: string
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
  sequence: bigint
}

type BriaEventHandler = (event: BriaEvent) => Promise<true | ApplicationError>
