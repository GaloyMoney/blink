type ClientReadableStream<T> = import("@grpc/grpc-js").ClientReadableStream<T>

type UtxoDetectedEvent = {
  payload: "utxo_detected"
  sequence: string
  recorded_at: number
  utxo_detected: {
    wallet_id: WalletId
    tx_id: OnChainTxHash
    vout: number
    satoshis: string
    address: OnChainAddress
  }
}

type UtxoSettledEvent = {
  payload: "utxo_settled"
  sequence: string
  recorded_at: number
  utxo_settled: {
    wallet_id: WalletId
    tx_id: OnChainTxHash
    vout: number
    satoshis: string
    address: OnChainAddress
    block_height: number
    block_time: string
  }
}

type UtxoEvent = UtxoDetectedEvent | UtxoSettledEvent

type BriaEvent = UtxoEvent
type BriaEventHandler = (event: BriaEvent) => true | ApplicationError

interface INewOnChainService {
  subscribeToAll(
    callback: BriaEventHandler,
  ): ClientReadableStream<BriaEvent> | OnChainServiceError
}
