import { Metadata } from "@grpc/grpc-js"
import { Empty } from "google-protobuf/google/protobuf/empty_pb"

import { GrpcStreamClient } from "@/utils"

const { streamBuilder, Stream, StreamEvents } = GrpcStreamClient

const methodMock = jest.fn()
const handler = jest.fn()

describe("streamBuilder", () => {
  it("should add event listener for onData", () => {
    const result = streamBuilder(methodMock).onData(handler)

    expect(result.state.listeners).toHaveLength(1)
    expect(result.state.listeners).toContainEqual({
      type: StreamEvents.data,
      listener: handler,
      listenerOptions: undefined,
    })
  })

  it("should add event listener for onEnd", () => {
    const result = streamBuilder(methodMock).onEnd(handler)

    expect(result.state.listeners).toHaveLength(1)
    expect(result.state.listeners).toContainEqual({
      type: StreamEvents.end,
      listener: handler,
      listenerOptions: undefined,
    })
  })

  it("should add event listener for onError", () => {
    const result = streamBuilder(methodMock).onError(handler)

    expect(result.state.listeners).toHaveLength(1)
    expect(result.state.listeners).toContainEqual({
      type: StreamEvents.error,
      listener: handler,
      listenerOptions: undefined,
    })
  })

  it("should add event listener for onRetry", () => {
    const result = streamBuilder(methodMock).onRetry(handler)

    expect(result.state.listeners).toHaveLength(1)
    expect(result.state.listeners).toContainEqual({
      type: StreamEvents.retry,
      listener: handler,
      listenerOptions: undefined,
    })
  })

  it("should add event listener for onMetadata", () => {
    const result = streamBuilder(methodMock).onMetadata(handler)

    expect(result.state.listeners).toHaveLength(1)
    expect(result.state.listeners).toContainEqual({
      type: StreamEvents.metadata,
      listener: handler,
      listenerOptions: undefined,
    })
  })

  it("should update method with withMethod", () => {
    const newMethodMock = jest.fn()
    const result = streamBuilder(methodMock).withMethod(newMethodMock)

    expect(result.state.method).toBe(newMethodMock)
  })

  it("should update request with withRequest", () => {
    const newRequest = new Empty()
    const result = streamBuilder(methodMock).withRequest(newRequest)

    expect(result.state.request).toBe(newRequest)
  })

  it("should update metadata with withMetadata", () => {
    const metadata = new Metadata()
    metadata.set("key", "value")
    const result = streamBuilder(methodMock).withMetadata(metadata)

    expect(result.state.metadata).toBe(metadata)
  })

  it("should update backoff with withBackoff", () => {
    const newBackoff = new GrpcStreamClient.FibonacciBackoff(30000, 7)
    const result = streamBuilder(methodMock).withBackoff(newBackoff)

    expect(result.state.backoff).toBe(newBackoff)
  })

  it("should update options with withOptions", () => {
    const newOptions = { retry: true }
    const result = streamBuilder(methodMock).withOptions(newOptions)

    expect(result.state.options).toBe(newOptions)
  })

  it("should build a valid Stream", () => {
    const mockConnect = jest.fn()
    const metadata = new Metadata()
    metadata.set("key", "value")

    jest.spyOn(Stream.prototype, "connect").mockImplementationOnce(mockConnect)
    const result = streamBuilder(methodMock)
      .withMetadata(metadata)
      .onMetadata(handler)
      .onData(handler)
      .onError(handler)
      .onEnd(handler)
      .onRetry(handler)
      .build()

    expect(mockConnect).toHaveBeenCalled()
    expect(result).toBeInstanceOf(Stream)
    expect(result.metaData).toBe(metadata)
    expect(result.eventListeners.metadata).toHaveLength(1)
    expect(result.eventListeners.data).toHaveLength(1)
    expect(result.eventListeners.end).toHaveLength(1)
    expect(result.eventListeners.error).toHaveLength(1)
    expect(result.eventListeners.retry).toHaveLength(1)
  })
})
