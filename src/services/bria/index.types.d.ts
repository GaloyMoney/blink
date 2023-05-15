type ClientReadableStream<T> = import("@grpc/grpc-js").ClientReadableStream<T>

type BriaPayloadType =
  typeof import("./index").BriaPayloadType[keyof typeof import("./index").BriaPayloadType]

interface UtxoDetectedEvent extends OnChainEvent {
  payload: Extract<BriaPayloadType, "utxo_detected">
  utxo_detected: {
    wallet_id: WalletId
    tx_id: OnChainTxHash
    vout: number
    satoshis: string
    address: OnChainAddress
  }
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

type UtxoEvent = UtxoDetectedEvent | UtxoSettledEvent

type BriaEvent = UtxoEvent
type BriaEventHandler = (event: BriaEvent) => true | ApplicationError
