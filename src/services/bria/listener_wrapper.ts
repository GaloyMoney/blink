import { BriaEvent as ProtoBriaEvent } from "./proto/bria_pb"

export class ListenerWrapper {
  _listener: ClientReadableStream<ProtoBriaEvent>
  _errorHandler: (err: Error) => void

  constructor(listener: ClientReadableStream<ProtoBriaEvent>, errorHandler) {
    this._listener = listener
    this._errorHandler = errorHandler
    this.setErrorHandler(errorHandler)
  }

  cancel() {
    this._listener.cancel()
  }

  setErrorHandler(errorHandler) {
    this._errorHandler = errorHandler
    this._listener.on("error", this._errorHandler)
  }

  _setDataHandler(dataHandler) {
    this._listener.on("data", dataHandler)
  }

  _merge(other: ListenerWrapper) {
    this._listener.cancel()
    this._listener = other._listener
    this._listener.on("error", this._errorHandler)
  }
}
