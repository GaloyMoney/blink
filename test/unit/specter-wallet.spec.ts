import { redis } from "src/redis"
import { btc2sat } from "src/utils"
import { SpecterWallet } from "src/SpecterWallet"

beforeAll(async () => {
  // avoids to use --forceExit and the need of a running redis
  redis.disconnect()
})

describe("SpecterWallet", () => {
  describe("isRebalanceNeeded", () => {
    it("returns deposit amount calculation", async () => {
      const lndBalance = btc2sat(1)
      const onChain = btc2sat(0.8)
      const result = SpecterWallet.isRebalanceNeeded({ lndBalance, onChain })

      expect(result).toStrictEqual({
        action: "deposit",
        sats: 50000000,
        reason: undefined,
      })
    })

    it("returns withdraw amount calculation", async () => {
      const lndBalance = btc2sat(0.2)
      const onChain = btc2sat(0.1)
      const result = SpecterWallet.isRebalanceNeeded({ lndBalance, onChain })

      expect(result).toStrictEqual({ action: "withdraw", sats: 30000000 })
    })

    it("returns undefined when no action needed", async () => {
      const lndBalance = btc2sat(0.5)
      const onChain = btc2sat(0.5)
      const result = SpecterWallet.isRebalanceNeeded({ lndBalance, onChain })

      expect(result).toStrictEqual({ action: undefined })
    })
  })
})
