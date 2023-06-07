import { Stream, StreamEvents } from "./stream"

export const streamBuilder = <T extends GrpcData, R extends GrpcData>(
  method: StreamMethod<T>,
  request?: R,
  metadata?: GrpcMetadata,
  backoff?: BaseBackOff,
  options?: StreamOptions,
  listeners: Array<{
    type: keyof typeof StreamEvents
    listener: Listener<T, R, keyof StreamEventMap>
    listenerOptions?: boolean | EventListenerOptions
  }> = [],
) => {
  const addEventListener = <K extends keyof StreamEventMap>(
    type: K,
    listener: Listener<T, R, K>,
    listenerOptions?: boolean | EventListenerOptions,
  ) =>
    streamBuilder<T, R>(method, request, metadata, backoff, options, [
      ...listeners,
      {
        type,
        listener: listener as Listener<T, R, keyof StreamEventMap>,
        listenerOptions,
      },
    ])

  const build = (): Stream<T, R> => {
    const stream = new Stream<T, R>(method, request, metadata, backoff, options)
    if (listeners) {
      listeners.forEach(({ type, listener, listenerOptions }) =>
        stream.addEventListener(type, listener, listenerOptions),
      )
    }
    return stream
  }

  return {
    state: { method, request, metadata, backoff, options, listeners },
    withMethod: (method: StreamMethod<T>) =>
      streamBuilder<T, R>(method, request, metadata, backoff, options, listeners),
    withRequest: (request: R) =>
      streamBuilder<T, R>(method, request, metadata, backoff, options, listeners),
    withMetadata: (metadata: GrpcMetadata) =>
      streamBuilder<T, R>(method, request, metadata, backoff, options, listeners),
    withBackoff: (backoff: BaseBackOff) =>
      streamBuilder<T, R>(method, request, metadata, backoff, options, listeners),
    withOptions: (options: StreamOptions) =>
      streamBuilder<T, R>(method, request, metadata, backoff, options, listeners),

    addEventListener: <K extends keyof StreamEventMap>(
      type: K,
      listener: Listener<T, R, K>,
      listenerOptions?: boolean | EventListenerOptions,
    ) => addEventListener(type, listener, listenerOptions),

    onData: (
      listener: (instance: Stream<T, R>, ev: T) => unknown,
      listenerOptions?: boolean | EventListenerOptions,
    ) =>
      addEventListener(
        StreamEvents.data,
        listener as Listener<T, R, "data">,
        listenerOptions,
      ),

    onEnd: (
      listener: Listener<T, R, "end">,
      listenerOptions?: boolean | EventListenerOptions,
    ) => addEventListener(StreamEvents.end, listener, listenerOptions),

    onError: (
      listener: Listener<T, R, "error">,
      listenerOptions?: boolean | EventListenerOptions,
    ) => addEventListener(StreamEvents.error, listener, listenerOptions),

    onRetry: (
      listener: Listener<T, R, "retry">,
      listenerOptions?: boolean | EventListenerOptions,
    ) => addEventListener(StreamEvents.retry, listener, listenerOptions),

    onMetadata: (
      listener: Listener<T, R, "metadata">,
      listenerOptions?: boolean | EventListenerOptions,
    ) => addEventListener(StreamEvents.metadata, listener, listenerOptions),

    build,
  }
}
