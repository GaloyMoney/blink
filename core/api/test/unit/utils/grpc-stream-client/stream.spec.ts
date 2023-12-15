import { Metadata, ServiceError } from "@grpc/grpc-js"
import { Empty } from "google-protobuf/google/protobuf/empty_pb"

import { GrpcStreamClient } from "@/utils"

const { Stream, StreamEvents } = GrpcStreamClient

jest.useFakeTimers()

afterAll(() => {
  jest.useRealTimers()
})

describe("Stream", () => {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  let mockStreamMethod
  // @ts-ignore-next-line no-implicit-any error
  let mockGrpcData
  // @ts-ignore-next-line no-implicit-any error
  let mockMetaData
  // @ts-ignore-next-line no-implicit-any error
  let mockBackoff
  let mockOptions
  // @ts-ignore-next-line no-implicit-any error
  let mockStream

  beforeEach(() => {
    mockStreamMethod = jest.fn()
    mockGrpcData = Empty
    mockMetaData = new Metadata()
    mockBackoff = { next: jest.fn(), reset: jest.fn() }
    mockOptions = { retry: true, retries: 3, isObject: false }

    mockStream = new Stream(
      mockStreamMethod,
      // @ts-ignore-next-line no-implicit-any error
      mockGrpcData,
      mockMetaData,
      mockBackoff,
      mockOptions,
    )
  })

  it("should add a listener to the specified event", () => {
    const mockListener = jest.fn()
    // @ts-ignore-next-line no-implicit-any error
    mockStream.addEventListener(StreamEvents.data, mockListener)
    // @ts-ignore-next-line no-implicit-any error
    expect(mockStream.eventListeners.data).toHaveLength(1)
  })

  it("should remove a listener from the specified event", () => {
    const mockListener = jest.fn()
    // @ts-ignore-next-line no-implicit-any error
    mockStream.addEventListener(StreamEvents.data, mockListener)
    // @ts-ignore-next-line no-implicit-any error
    mockStream.removeEventListener(StreamEvents.data, mockListener)
    // @ts-ignore-next-line no-implicit-any error
    expect(mockStream.eventListeners.data).toHaveLength(0)
  })

  it("should create a new stream using the provided method", () => {
    // @ts-ignore-next-line no-implicit-any error
    mockStreamMethod.mockClear()
    // @ts-ignore-next-line no-implicit-any error
    mockStream.connect()
    // @ts-ignore-next-line no-implicit-any error
    expect(mockStreamMethod).toHaveBeenCalledWith(mockGrpcData, mockMetaData)
  })

  it("should dispatch the event to the listeners", () => {
    const mockListener = jest.fn()
    const mockEvent = {} as ServiceError
    // @ts-ignore-next-line no-implicit-any error
    mockStream.addEventListener(StreamEvents.error, mockListener)
    // @ts-ignore-next-line no-implicit-any error
    mockStream.handleEvent(StreamEvents.error, mockEvent)
    // @ts-ignore-next-line no-implicit-any error
    expect(mockListener).toHaveBeenCalledWith(mockStream, mockEvent)
  })

  it("should schedule a reconnect using backoff", () => {
    const backoff = 5000
    // @ts-ignore-next-line no-implicit-any error
    mockBackoff.next.mockReturnValue(backoff)
    // @ts-ignore-next-line no-implicit-any error
    mockStreamMethod.mockClear()
    // @ts-ignore-next-line no-implicit-any error
    mockStream.reconnect()
    jest.advanceTimersByTime(backoff)
    // @ts-ignore-next-line no-implicit-any error
    expect(mockStreamMethod).toHaveBeenCalledWith(mockGrpcData, mockMetaData)
  })
})
