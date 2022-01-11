import { SpecterWallet } from "@core/specter-wallet"
import { getSpecterWalletConfig } from "@config/app"
import { baseLogger } from "@services/logger"
import { toSats } from "@domain/bitcoin"

jest.mock("@config/app.ts", () => {
  const config = jest.requireActual("@config/app.ts")
  config.yamlConfig.lnds = []
  return config
})

jest.mock("@services/redis", () => ({}))

let specterWallet

beforeAll(() => {
  const specterWalletConfig = getSpecterWalletConfig()
  specterWallet = new SpecterWallet({
    logger: baseLogger,
    config: specterWalletConfig,
  })
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe("SpecterWallet", () => {
  describe("isRebalanceNeeded", () => {
    it("returns deposit amount calculation", () => {
      const lndBalance = toSats(100_000_000)
      const onChain = toSats(80_000_000)
      const result = specterWallet.isRebalanceNeeded({ lndBalance, onChain })

      expect(result).toStrictEqual({
        action: "deposit",
        sats: 50000000,
        reason: undefined,
      })
    })

    it("returns withdraw amount calculation", () => {
      const lndBalance = toSats(20_000_000)
      const onChain = toSats(10_000_000)
      const result = specterWallet.isRebalanceNeeded({ lndBalance, onChain })

      expect(result).toStrictEqual({ action: "withdraw", sats: 30000000 })
    })

    it("returns undefined when no action needed", () => {
      const lndBalance = toSats(50_000_000)
      const onChain = toSats(50_000_000)
      const result = specterWallet.isRebalanceNeeded({ lndBalance, onChain })

      expect(result).toStrictEqual({ action: undefined })
    })
  })
})
