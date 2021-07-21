const { redis } = require("src/redis")
const { setupMongoConnection } = require("src/mongodb")

let mongoose

beforeAll(async () => {
  mongoose = await setupMongoConnection()
})

afterAll(async () => {
  // avoids to use --forceExit
  redis.disconnect()
  if (mongoose) {
    await mongoose.connection.close()
  }
})

jest.setTimeout(process.env.JEST_TIMEOUT || 30000)
