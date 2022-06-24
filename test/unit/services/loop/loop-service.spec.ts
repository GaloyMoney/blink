import { loopOut } from "@services/loop/loop-service"

jest.mock("@services/redis", () => ({}))

jest.mock("@config", () => {
  const config = jest.requireActual("@config")
  const getLndParams = (): LndParams[] => []
  return { ...config, getLndParams }
})

afterAll(async () => {
  jest.restoreAllMocks()
})

describe("loop", () => {
  it("loop out should return data", async () => {
    const data = await loopOut()
    expect(data).toBeTruthy
  })
})
