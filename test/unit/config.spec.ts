import { defaultConfig } from "src/config"

describe("config.ts", () => {
  describe("defaultConfig", () => {
    it("has hedging and name properties", () => {
      expect(defaultConfig).toHaveProperty("hedging")
      expect(defaultConfig).toHaveProperty("name")
    })
  })
})
