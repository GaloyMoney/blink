import { Metadata, ServiceError } from "@grpc/grpc-js"
import { Empty } from "google-protobuf/google/protobuf/empty_pb"

import { GrpcStreamClient } from "@/utils"

const { Stream, StreamEvents } = GrpcStreamClient

jest.useFakeTimers()

afterAll(() => {
  jest.useRealTimers()
})

describe("Stream", () => {
  let mockStreamMethod
  let mockGrpcData
  let mockMetaData
  let mockBackoff
  let mockOptions
  let mockStream

  beforeEach(() => {
    mockStreamMethod = jest.fn()
    mockGrpcData = Empty
    mockMetaData = new Metadata()
    mockBackoff = { next: jest.fn(), reset: jest.fn() }
    mockOptions = { retry: true, retries: 3, isObject: false }

    mockStream = new Stream(
      mockStreamMethod,
      mockGrpcData,
      mockMetaData,
      mockBackoff,
      mockOptions,
    )
  })

  it("should add a listener to the specified event", () => {
    const mockListener = jest.fn()
    mockStream.addEventListener(StreamEvents.data, mockListener)
    expect(mockStream.eventListeners.data).toHaveLength(1)
  })

  it("should remove a listener from the specified event", () => {
    const mockListener = jest.fn()
    mockStream.addEventListener(StreamEvents.data, mockListener)
    mockStream.removeEventListener(StreamEvents.data, mockListener)
    expect(mockStream.eventListeners.data).toHaveLength(0)
  })

  it("should create a new stream using the provided method", () => {
    mockStreamMethod.mockClear()
    mockStream.connect()
    expect(mockStreamMethod).toHaveBeenCalledWith(mockGrpcData, mockMetaData)
  })

  it("should dispatch the event to the listeners", () => {
    const mockListener = jest.fn()
    const mockEvent = {} as ServiceError
    mockStream.addEventListener(StreamEvents.error, mockListener)
    mockStream.handleEvent(StreamEvents.error, mockEvent)
    expect(mockListener).toHaveBeenCalledWith(mockStream, mockEvent)
  })

  it("should schedule a reconnect using backoff", () => {
    const backoff = 5000
    mockBackoff.next.mockReturnValue(backoff)
    mockStreamMethod.mockClear()
    mockStream.reconnect()
    jest.advanceTimersByTime(backoff)
    expect(mockStreamMethod).toHaveBeenCalledWith(mockGrpcData, mockMetaData)
  })
})
