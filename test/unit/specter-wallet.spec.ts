import { redis } from "@services/redis"
import { btc2sat } from "@core/utils"
import { SpecterWallet } from "@core/specter-wallet"
import { getSpecterWalletConfig } from "@config/app"
import { baseLogger } from "@services/logger"

jest.mock("@config/app.ts", () => {
  const config = jest.requireActual("@config/app.ts")
  config.yamlConfig.lnds = []
  return config
})

let specterWallet

beforeAll(() => {
  // avoids to use --forceExit and the need of a running redis
  redis.disconnect()

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
      const lndBalance = btc2sat(1)
      const onChain = btc2sat(0.8)
      const result = specterWallet.isRebalanceNeeded({ lndBalance, onChain })

      expect(result).toStrictEqual({
        action: "deposit",
        sats: 50000000,
        reason: undefined,
      })
    })

    it("returns withdraw amount calculation", () => {
      const lndBalance = btc2sat(0.2)
      const onChain = btc2sat(0.1)
      const result = specterWallet.isRebalanceNeeded({ lndBalance, onChain })

      expect(result).toStrictEqual({ action: "withdraw", sats: 30000000 })
    })

    it("returns undefined when no action needed", () => {
      const lndBalance = btc2sat(0.5)
      const onChain = btc2sat(0.5)
      const result = specterWallet.isRebalanceNeeded({ lndBalance, onChain })

      expect(result).toStrictEqual({ action: undefined })
    })
  })
})
