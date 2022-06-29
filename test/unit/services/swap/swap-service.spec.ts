import { swapOut } from "@services/swap/swap-service"

jest.mock("@services/redis", () => ({}))

jest.mock("@config", () => {
  const config = jest.requireActual("@config")
  const getLndParams = (): LndParams[] => []
  return { ...config, getLndParams }
})

afterAll(async () => {
  jest.restoreAllMocks()
})

describe("swap", () => {
  it("out should return data", async () => {
    const data = await swapOut()
    expect(data).toBeTruthy
  })
})
