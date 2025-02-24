// we can't mock db because pg specific queries
// import { newDb } from "pg-mem"
// import type { Knex } from "knex"

// // Mock the config before any imports
// jest.mock("@/services/db/knex", () => {
//   // Create the in-memory db and knex instance before mocking
//   const db = newDb()
//   const knex = db.adapters.createKnex() as Knex
//   return { knex }
// })

import { knex } from "@/services/db/knex"
import { lockVoucherSecret, lockVoucherK1 } from "@/services/lock"

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

afterAll(async () => {
  try {
    knex.destroy()
  } catch (e) {
    // ignore
  }
})

describe("Lock service", () => {
  describe("lockVoucherSecret", () => {
    it("should return result when async function succeeds", async () => {
      const expectedResult = { data: "success" }
      const asyncFn = jest.fn().mockResolvedValue(expectedResult)

      const result = await lockVoucherSecret("test-secret", asyncFn)

      expect(result).toEqual(expectedResult)
      expect(asyncFn).toHaveBeenCalled()
    })

    it("should return error when async function returns undefined", async () => {
      const asyncFn = jest.fn().mockResolvedValue(undefined)

      const result = await lockVoucherSecret("test-secret", asyncFn)

      expect(asyncFn).toHaveBeenCalled()
      expect(result).toBeInstanceOf(Error)
      expect((result as Error).message).toBe("Lock execution failed without a result")
    })

    it("should return error when async function throws", async () => {
      const error = new Error("Custom error")
      const asyncFn = jest.fn().mockRejectedValue(error)

      const result = await lockVoucherSecret("test-secret", asyncFn)

      expect(asyncFn).toHaveBeenCalled()
      expect(result).toBeInstanceOf(Error)
      expect(result).toBe(error)
    })

    it("should serialize concurrent operations with the same secret", async () => {
      const executionOrder: number[] = []
      const delay1 = 1
      const delay2 = 50

      const fn1 = jest.fn().mockImplementation(async () => {
        await delay(100)
        executionOrder.push(1)
        return { data: "first" }
      })

      const fn2 = jest.fn().mockImplementation(async () => {
        executionOrder.push(2)
        return { data: "second" }
      })

      const promise1 = delay(delay1).then(() => lockVoucherSecret("same-secret", fn1))
      const promise2 = delay(delay2).then(() => lockVoucherSecret("same-secret", fn2))
      const [result1, result2] = await Promise.all([promise1, promise2])

      // Verify results
      expect(result1).toEqual({ data: "first" })
      expect(result2).toEqual({ data: "second" })

      // Verify execution order - should be sequential despite different delays
      expect(executionOrder).toEqual([1, 2])
    })

    it("should allow concurrent operations with different secrets", async () => {
      const executionOrder: number[] = []
      const delay1 = 100
      const delay2 = 50

      const fn1 = jest.fn().mockImplementation(async () => {
        executionOrder.push(1)
        return { data: "first" }
      })

      const fn2 = jest.fn().mockImplementation(async () => {
        executionOrder.push(2)
        return { data: "second" }
      })

      const promise1 = delay(delay1).then(() => lockVoucherSecret("secret1", fn1))
      const promise2 = delay(delay2).then(() => lockVoucherSecret("secret2", fn2))
      const [result1, result2] = await Promise.all([promise1, promise2])

      // Verify results
      expect(result1).toEqual({ data: "first" })
      expect(result2).toEqual({ data: "second" })

      // Verify execution order - should be concurrent (2 finishes before 1 due to shorter delay)
      expect(executionOrder).toEqual([2, 1])
    })

    it("should release lock after completion even if operation fails", async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error("Operation failed"))
      const successFn = jest.fn().mockResolvedValue({ data: "success" })

      // First operation fails
      await lockVoucherSecret("test-secret", failingFn)

      // Second operation should still be able to acquire the lock
      const result = await lockVoucherSecret("test-secret", successFn)

      expect(failingFn).toHaveBeenCalled()
      expect(successFn).toHaveBeenCalled()
      expect(result).toEqual({ data: "success" })
    })
  })

  describe("lockVoucherK1", () => {
    it("should return result when async function succeeds", async () => {
      const expectedResult = { data: "success" }
      const asyncFn = jest.fn().mockResolvedValue(expectedResult)

      const result = await lockVoucherK1("test-k1", asyncFn)

      expect(asyncFn).toHaveBeenCalled()
      expect(result).toEqual(expectedResult)
    })

    it("should return error when async function returns undefined", async () => {
      const asyncFn = jest.fn().mockResolvedValue(undefined)

      const result = await lockVoucherK1("test-k1", asyncFn)

      expect(asyncFn).toHaveBeenCalled()
      expect(result).toBeInstanceOf(Error)
      expect((result as Error).message).toBe("Lock execution failed without a result")
    })

    it("should return error when async function throws", async () => {
      const error = new Error("Custom error")
      const asyncFn = jest.fn().mockRejectedValue(error)

      const result = await lockVoucherK1("test-k1", asyncFn)

      expect(asyncFn).toHaveBeenCalled()
      expect(result).toBeInstanceOf(Error)
      expect(result).toBe(error)
    })

    it("should serialize concurrent operations with the same k1", async () => {
      const executionOrder: number[] = []
      const delay1 = 1
      const delay2 = 50

      const fn1 = jest.fn().mockImplementation(async () => {
        await delay(100)
        executionOrder.push(1)
        return { data: "first" }
      })

      const fn2 = jest.fn().mockImplementation(async () => {
        executionOrder.push(2)
        return { data: "second" }
      })

      const promise1 = delay(delay1).then(() => lockVoucherK1("same-k1", fn1))
      const promise2 = delay(delay2).then(() => lockVoucherK1("same-k1", fn2))
      const [result1, result2] = await Promise.all([promise1, promise2])

      // Verify results
      expect(result1).toEqual({ data: "first" })
      expect(result2).toEqual({ data: "second" })

      // Verify execution order - should be sequential despite different delays
      expect(executionOrder).toEqual([1, 2])
    })

    it("should allow concurrent operations with different k1s", async () => {
      const executionOrder: number[] = []
      const delay1 = 100
      const delay2 = 50

      const fn1 = jest.fn().mockImplementation(async () => {
        executionOrder.push(1)
        return { data: "first" }
      })

      const fn2 = jest.fn().mockImplementation(async () => {
        executionOrder.push(2)
        return { data: "second" }
      })

      const promise1 = delay(delay1).then(() => lockVoucherK1("k1-1", fn1))
      const promise2 = delay(delay2).then(() => lockVoucherK1("k1-2", fn2))
      const [result1, result2] = await Promise.all([promise1, promise2])

      // Verify results
      expect(result1).toEqual({ data: "first" })
      expect(result2).toEqual({ data: "second" })

      // Verify execution order - should be concurrent (2 finishes before 1 due to shorter delay)
      expect(executionOrder).toEqual([2, 1])
    })

    it("should release lock after completion even if operation fails", async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error("Operation failed"))
      const successFn = jest.fn().mockResolvedValue({ data: "success" })

      // First operation fails
      await lockVoucherK1("test-k1", failingFn)

      // Second operation should still be able to acquire the lock
      const result = await lockVoucherK1("test-k1", successFn)

      expect(failingFn).toHaveBeenCalled()
      expect(successFn).toHaveBeenCalled()
      expect(result).toEqual({ data: "success" })
    })
  })
})
