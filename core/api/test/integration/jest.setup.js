const { disconnectAll } = require("@/services/redis")
const { setupMongoConnection } = require("@/services/mongodb")

let mongoose

jest.mock("@/services/lnd/auth", () => {
  const module = jest.requireActual("@/services/lnd/auth")
  const lndsConnect = module.lndsConnect.map((p) => ({ ...p, active: true }))
  return { ...module, lndsConnect }
})

// Mock prices
jest.mock("@/app/prices/get-current-price", () => require("test/mocks/get-current-price"))

beforeAll(async () => {
  mongoose = await setupMongoConnection(true)
})

afterAll(async () => {
  // avoids to use --forceExit
  disconnectAll()
  if (mongoose) {
    await mongoose.connection.close()
  }
})

jest.setTimeout(process.env.JEST_TIMEOUT || 30000)

