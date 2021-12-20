const { redis, redisSub } = require("@services/redis")
const { setupMongoConnection } = require("@services/mongodb")

let mongoose

beforeAll(async () => {
  mongoose = await setupMongoConnection(true)
})

afterAll(async () => {
  // avoids to use --forceExit
  redis.disconnect()
  redisSub.disconnect()
  if (mongoose) {
    await mongoose.connection.close()
  }
})

jest.setTimeout(process.env.JEST_TIMEOUT || 30000)
