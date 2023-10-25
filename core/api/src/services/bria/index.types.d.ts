type BriaEventError = import("./errors").BriaEventError

type ClientReadableStream<T> = import("@grpc/grpc-js").ClientReadableStream<T>

type BriaPayloadType =
  (typeof import("./index").BriaPayloadType)[keyof typeof import("./index").BriaPayloadType]

type AddressAugmentation = {
  address: OnChainAddress
  externalId: string
}

type PayoutMetadata = {
  galoy?: {
    rebalanceToColdWallet?: boolean
  }
}

type PayoutAugmentation = {
  id: PayoutId
  externalId: string
  metadata?: PayoutMetadata
}

type BriaEventAugmentation = {
  addressInfo?: AddressAugmentation
  payoutInfo?: PayoutAugmentation
}

type UtxoDetected = {
  type: "utxo_detected"
  txId: OnChainTxHash
  vout: OnChainTxVout
  satoshis: BtcPaymentAmount
  address: OnChainAddress
}
type UtxoDropped = {
  type: "utxo_dropped"
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
  id: PayoutId
  satoshis: BtcPaymentAmount
}
type PayoutCommitted = {
  type: "payout_committed"
  id: PayoutId
  satoshis: BtcPaymentAmount
}
type PayoutBroadcast = {
  type: "payout_broadcast"
  id: PayoutId
  proportionalFee: BtcPaymentAmount
  satoshis: BtcPaymentAmount
  txId: OnChainTxHash
  vout: OnChainTxVout
  address: OnChainAddress
}
type PayoutSettled = {
  type: "payout_settled"
  id: PayoutId
  proportionalFee: BtcPaymentAmount
  satoshis: BtcPaymentAmount
  txId: OnChainTxHash
  vout: OnChainTxVout
  address: OnChainAddress
}

type PayoutCancelled = {
  type: "payout_cancelled"
  id: PayoutId
  satoshis: BtcPaymentAmount
  address: OnChainAddress
}

type BriaPayoutPayload =
  | PayoutSubmitted
  | PayoutCommitted
  | PayoutBroadcast
  | PayoutSettled
  | PayoutCancelled

type BriaPayload = UtxoDetected | UtxoDropped | UtxoSettled | BriaPayoutPayload

type BriaEvent = {
  payload: BriaPayload
  augmentation: BriaEventAugmentation
  sequence: number
}

type BriaBroadcastEvent = {
  payload: PayoutBroadcast
  augmentation: { payoutInfo: PayoutAugmentation }
  sequence: number
}

type BriaEventHandler = (event: BriaEvent) => Promise<true | DomainError>

type BriaErrorHandler = (err: Error) => void
