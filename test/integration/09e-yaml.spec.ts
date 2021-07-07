import { defaultConfig } from "src/config"

it("test", async () => {
  try {
    console.log(defaultConfig)
    expect(defaultConfig).toHaveProperty("hedging")
    expect(defaultConfig).toHaveProperty("name")
  } catch (e) {
    console.log(e)
  }
})
