import { transactions } from "../mock-data/transaction"
import { getBalanceForTransactions } from "../../lib/get-balance-for-transactions"

describe("getBalanceForTransactions Tests", () => {
  const currentUsdBalance = 36240
  const currentBtcBalance = 1993700
  let result

  beforeAll(() => {
    result = getBalanceForTransactions({
      transactions,
      currentUsdBalance,
      currentBtcBalance,
    })
  })

  it("should contain all required fields", () => {
    expect(result).toHaveProperty("usdTransactions")
    expect(result).toHaveProperty("btcTransactions")
    expect(result).toHaveProperty("minBalance")
    expect(result).toHaveProperty("maxBalance")
  })

  describe("Check data types of fields", () => {
    it("usdTransactions and btcTransactions should be arrays", () => {
      expect(Array.isArray(result.usdTransactions)).toBe(true)
      expect(Array.isArray(result.btcTransactions)).toBe(true)
    })

    it("minBalance and maxBalance should be objects", () => {
      expect(typeof result.minBalance).toBe("object")
      expect(typeof result.maxBalance).toBe("object")
    })

    it("transactions items should have correct structure and data types", () => {
      result.usdTransactions.forEach((tx) => {
        expect(tx).toHaveProperty("balance")
        expect(typeof tx.balance).toBe("number")
        expect(tx).toHaveProperty("date")
        expect(typeof tx.date).toBe("string")
        expect(tx).toHaveProperty("dateTime")
        expect(typeof tx.dateTime).toBe("string")
      })

      result.btcTransactions.forEach((tx) => {
        expect(tx).toHaveProperty("balance")
        expect(typeof tx.balance).toBe("number")
        expect(tx).toHaveProperty("date")
        expect(typeof tx.date).toBe("string")
        expect(tx).toHaveProperty("dateTime")
        expect(typeof tx.dateTime).toBe("string")
      })
    })
  })

  describe("Correctness of computed results", () => {
    it("should compute usdTransactions correctly", () => {
      expect(result.usdTransactions).toEqual(expectedData.usdTransactions)
    })

    it("should compute btcTransactions correctly", () => {
      expect(result.btcTransactions).toEqual(expectedData.btcTransactions)
    })

    it("should compute minBalance and maxBalance correctly", () => {
      const expectedMinBalance = { usd: 199.2, btc: 997000 }
      const expectedMaxBalance = { usd: 398.4, btc: 1994000 }
      expect(result.minBalance).toEqual(expectedMinBalance)
      expect(result.maxBalance).toEqual(expectedMaxBalance)
    })
  })
})

const expectedData = {
  usdTransactions: [
    {
      balance: 362.4, // send 1200 hence balance 36240 cents
      date: "Apr 26",
      dateTime: "April 26, 2024 at 09:57:14 PM",
    },
    {
      balance: 374.4, // send 1200 hence balance 37440 cents
      date: "Apr 26",
      dateTime: "April 26, 2024 at 09:57:12 PM",
    },
    {
      balance: 386.4, // sent 1200 cents hence balance 38640 cents
      date: "Apr 26",
      dateTime: "April 26, 2024 at 09:57:09 PM",
    },
    {
      balance: 398.4, // received 19920 again hence balance 39840 cents
      date: "Apr 26",
      dateTime: "April 26, 2024 at 09:54:04 PM",
    },
    {
      balance: 199.2, // received 19920 cents as starting point
      date: "Apr 26",
      dateTime: "April 26, 2024 at 09:50:59 PM",
    },
  ],
  btcTransactions: [
    {
      balance: 1993700,
      date: "Apr 26",
      dateTime: "April 26, 2024 at 09:57:14 PM",
    },
    {
      balance: 1993800,
      date: "Apr 26",
      dateTime: "April 26, 2024 at 09:57:12 PM",
    },
    {
      balance: 1993900,
      date: "Apr 26",
      dateTime: "April 26, 2024 at 09:57:09 PM",
    },
    {
      balance: 1994000,
      date: "Apr 26",
      dateTime: "April 26, 2024 at 09:54:09 PM",
    },
    {
      balance: 997000,
      date: "Apr 26",
      dateTime: "April 26, 2024 at 09:51:04 PM",
    },
  ],
  minBalance: { usd: 199.2, btc: 997000 },
  maxBalance: { usd: 398.4, btc: 1994000 },
}
