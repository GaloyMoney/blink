import { Metadata } from "@grpc/grpc-js"
import { Empty } from "google-protobuf/google/protobuf/empty_pb"

export const StreamEvents = {
  metadata: "metadata",
  data: "data",
  error: "error",
  end: "end",
  retry: "retry",
} as const

export class Stream<T extends GrpcData, R extends GrpcData> {
  stream?: ClientReadableStream<T>
  method: StreamMethod<T>
  readonly request: R
  private metadata?: Metadata
  private readonly options?: StreamOptions
  backoff?: BaseBackOff
  private retries = 0
  private reconnectId?: NodeJS.Timeout
  readonly eventListeners: StreamEventMapA<T> = {
    metadata: [],
    data: [],
    end: [],
    error: [],
    retry: [],
  }

  constructor(
    method: StreamMethod<T>,
    request?: R,
    metadata?: Metadata | undefined,
    backoff?: BaseBackOff,
    options?: StreamOptions,
  ) {
    this.method = method
    this.request = request || (new Empty() as R)
    this.metadata = metadata
    this.options = options
    this.backoff = backoff
    this.connect()
  }

  public get metaData(): Metadata | undefined {
    return this.metadata
  }

  public set metaData(value: Metadata | undefined) {
    if (!value) return

    if (this.metadata) {
      this.metadata.merge(value)
      return
    }

    this.metadata = value
  }

  public addEventListener<K extends StreamEvents>(
    type: K,
    listener: Listener<T, R, K>,
    options?: boolean | EventListenerOptions,
  ): void {
    const _eventListener = { listener, options } as GrpcStreamEventsListener<T, R, K>
    const eventListeners = this.eventListeners[type] as GrpcStreamEventsListener<
      T,
      R,
      K
    >[]
    eventListeners.push(_eventListener)
  }

  public removeEventListener<K extends StreamEvents>(
    type: K,
    listener: Listener<T, R, K>,
    options?: boolean | EventListenerOptions,
  ): void {
    ;(this.eventListeners[type] as GrpcStreamEventsListener<T, R, K>[]) = (
      this.eventListeners[type] as GrpcStreamEventsListener<T, R, K>[]
    ).filter((l) => {
      return l.listener !== listener && (l.options === undefined || l.options !== options)
    })
  }

  private dispatchEvent<K extends StreamEvents>(type: K, ev: StreamEventMap[K]) {
    const listeners = this.eventListeners[type] as GrpcStreamEventsListener<T, R, K>[]
    const onceListeners = [] as GrpcStreamEventsListener<T, R, K>[]
    listeners.forEach((l) => {
      l.listener(this, ev)
      if (l.options !== undefined && (l.options as AddEventListenerOptions).once)
        onceListeners.push(l)
    })
    onceListeners.forEach((l) => this.removeEventListener(type, l.listener, l.options))
  }

  removeListeners(): void {
    if (this.stream) {
      this.stream.removeAllListeners(StreamEvents.metadata)
      this.stream.removeAllListeners(StreamEvents.data)
      this.stream.removeAllListeners(StreamEvents.end)
      this.stream.removeAllListeners(StreamEvents.error)
    }
  }

  cancel(): void {
    if (this.reconnectId) {
      clearTimeout(this.reconnectId)
      this.reconnectId = undefined
    }
    if (this.stream) {
      this.removeListeners()
      // required to avoid unhandled exception
      this.stream.on(StreamEvents.error, () => true)
      this.stream.cancel()
    }
  }

  connect(): void {
    this.cancel()
    this.stream = this.method(this.request, this.metadata)
    if (this.stream) {
      this.stream.on(StreamEvents.metadata, this.handleMetadataEvent)
      this.stream.on(StreamEvents.data, this.handleMessageEvent)
      this.stream.on(StreamEvents.end, this.handleCloseEvent)
      this.stream.on(StreamEvents.error, this.handleErrorEvent)
    }
  }

  private handleMetadataEvent = (ev: GrpcMetadata) =>
    this.handleEvent(StreamEvents.metadata, ev)

  private handleCloseEvent = () => this.handleEvent(StreamEvents.end, null)

  private handleErrorEvent = (ev: GrpcServiceError) =>
    this.handleEvent(StreamEvents.error, ev)

  private handleMessageEvent = (ev: GrpcData) => this.handleEvent(StreamEvents.data, ev)

  private handleEvent<K extends StreamEvents>(type: K, ev: StreamEventMap[K]) {
    switch (type) {
      case StreamEvents.end:
      case StreamEvents.error:
        if (this.options?.retry) {
          this.reconnect()
        }
        break
      case StreamEvents.data:
        if (this.reconnectId) {
          clearTimeout(this.reconnectId)
          this.reconnectId = undefined
        }
        this.retries = 0
        this.backoff?.reset()
        break
      default:
    }
    this.dispatchEvent<K>(type, ev)
  }

  reconnect() {
    if (!this.backoff || this.reconnectId) return

    if (this.stream && !this.options?.acceptDataOnReconnect) {
      this.stream.removeAllListeners(StreamEvents.data)
    }

    const backoff = this.backoff.next()
    this.reconnectId = setTimeout(() => {
      this.dispatchEvent(
        StreamEvents.retry,
        new CustomEvent<GrpcStreamRetryEventDetails>(StreamEvents.retry, {
          detail: {
            retries: ++this.retries,
            backoff: backoff,
          },
        }),
      )
      this.connect()
    }, backoff)
  }
}
