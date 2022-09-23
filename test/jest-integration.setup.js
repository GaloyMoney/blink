const { disconnectAll } = require("@services/redis")
const { setupMongoConnection } = require("@services/mongodb")

jest.mock("@config", () => {
  // we have to override the value in default.yaml
  //
  // those value works for e2e-in-ci where the tests are executed within docker
  // because end to end is starting main as a subprocess (the docker image starts main),
  // the only way it can access the other server is using dns.
  // localhost doesn't work because the sub process would only have access to the parent process (e2e-tests)
  // not the other service in the docker compose

  // for convenience, we still want to be able to test locally
  // so we're overriding the config here
  return {
    ...jest.requireActual("@config"),
    // getKratosConfig: jest.fn().mockReturnValue({
    //   publicApi: "http://localhost:4433",
    //   adminApi: "http://localhost:4434",
    //   corsAllowedOrigins: ["http://localhost:3000"],
    // }),
  }
})

jest.mock("@services/lnd/auth", () => {
  const module = jest.requireActual("@services/lnd/auth")
  module.params = module.params.map((p) => ({ ...p, active: true }))
  return module
})

jest.mock("@services/lnd/unauth", () => {
  const module = jest.requireActual("@services/lnd/unauth")
  module.params = module.params.map((p) => ({ ...p, active: true }))
  return module
})

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
