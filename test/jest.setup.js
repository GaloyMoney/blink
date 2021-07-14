const { redis } = require("src/redis");
const { setupMongoConnection } = require("src/mongodb")

let mongoose

beforeAll(async () => {
  mongoose = await setupMongoConnection()
})

afterAll(async () => {
  // avoid to use --forceExit
  redis.disconnect()
  await mongoose.connection.close()
})

jest.setTimeout(30000)
