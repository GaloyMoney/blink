/**
 * @jest-environment node
 */
import { setupMongoConnection } from "./db"

const mongoose = require("mongoose");
import { Hedging } from "./hedge"
// this import needs to be before medici

// jest.mock('ccxt');



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

