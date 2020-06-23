/**
 * @jest-environment node
 */
import { setupMongoConnection } from "./db"

const mongoose = require("mongoose");
import { Hedging } from "./hedge"
// this import needs to be before medici

// jest.mock('ccxt');

const lastBTCPrice = 0.000096006


beforeAll(async () => {
  await setupMongoConnection()
})

afterAll(async () => {
  return await mongoose.connection.close()
})

it('Lightning Wallet Get Info works', async () => {
  const hedge = new Hedging()
  await hedge.position()
})

it('calculate hedging amount when under exposed', async () => {
  const hedge = new Hedging()

  const equity = 10 * 10 ** 8
  const netSizeSats = - 7 * 10 ** 8

  const result = hedge.calculate({equity, netSizeSats, lastBTCPrice})
  expect(result).toEqual({needHedging: true, amount: 2 * 10 ** 8, direction: "sell"})
})

it('calculate hedging amount when over exposed', async () => {
  const hedge = new Hedging()

  const equity = 10 * 10 ** 8
  const netSizeSats = - 13 * 10 ** 8

  const result = hedge.calculate({equity, netSizeSats, lastBTCPrice})
  expect(result).toEqual({needHedging: true, amount: 2 * 10 ** 8, direction: "buy"})
})

it('no need for hedging', async () => {
  const hedge = new Hedging()

  const equity = 10 * 10 ** 8
  const netSizeSats = - 11 * 10 ** 8

  const result = hedge.calculate({equity, netSizeSats, lastBTCPrice})
  expect(result).toEqual({needHedging: false})
})


