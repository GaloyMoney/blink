import { GrpcStreamClient } from "@/utils"

const { FibonacciBackoff } = GrpcStreamClient

describe("FibonacciBackoff", () => {
  it("should correctly initialize FibonacciBackoff instance", () => {
    const fibBackOff = new FibonacciBackoff(100, 7)

    expect(fibBackOff).toBeDefined()
  })

  it("should correctly generate Fibonacci backoff series", () => {
    const fibBackOff = new FibonacciBackoff(100, 7)
    const expectedSeries = [100, 200, 300, 500, 800, 1300, 2100]

    for (let i = 0; i < 7; i++) {
      expect(fibBackOff.next()).toBe(expectedSeries[i])
    }
  })

  it("should return the last number after the limit is reached", () => {
    const fibBackOff = new FibonacciBackoff(100, 7)
    const expectedLastNumber = 2100

    for (let i = 0; i < 10; i++) {
      // Attempting to generate more numbers than the limit
      fibBackOff.next()
    }

    expect(fibBackOff.next()).toBe(expectedLastNumber)
  })

  it("should correctly reset the backoff series", () => {
    const fibBackOff = new FibonacciBackoff(100, 7)
    const expectedInitialNumber = 100

    fibBackOff.next()
    fibBackOff.next()
    fibBackOff.reset()

    expect(fibBackOff.next()).toBe(expectedInitialNumber)
  })
})
