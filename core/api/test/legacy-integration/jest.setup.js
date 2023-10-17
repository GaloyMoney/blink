const { disconnectAll } = require("@/services/redis")
const { setupMongoConnection } = require("@/services/mongodb")

jest.mock("@/services/lnd/auth", () => {
  const module = jest.requireActual("@/services/lnd/auth")
  const lndsConnect = module.lndsConnect.map((p) => ({ ...p, active: true }))
  return { ...module, lndsConnect }
})

jest.mock("@/app/prices/get-current-price", () => require("test/mocks/get-current-price"))
jest.mock("@/services/twilio-service", () => require("test/mocks/twilio"))
jest.mock("@/services/price", () => require("test/mocks/price"))


let mongoose

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
