import { defaultConfig } from "src/config"

describe("config.ts", () => {
  describe("defaultConfig", () => {
    it("should have hedging and name properties", () => {
      expect(defaultConfig).toHaveProperty("hedging")
      expect(defaultConfig).toHaveProperty("name")
    })
  })
})
