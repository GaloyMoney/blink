/**
 * @jest-environment node
 */
import { SpecterWallet } from "../SpecterWallet"
import { btc2sat } from "../utils"

it("deposit amount calculation", async () => {
  const lndBalance = btc2sat(1)
  const onChain = btc2sat(0.8)
  const result = SpecterWallet.isRebalanceNeeded({ lndBalance, onChain })

  expect(result).toStrictEqual({ action: "deposit", sats: 50000000, reason: undefined })
})

it("withdraw amount calculation", async () => {
  const lndBalance = btc2sat(0.2)
  const onChain = btc2sat(0.1)
  const result = SpecterWallet.isRebalanceNeeded({ lndBalance, onChain })

  expect(result).toStrictEqual({ action: "withdraw", sats: 30000000 })
})

it("not doing anything", async () => {
  const lndBalance = btc2sat(0.5)
  const onChain = btc2sat(0.5)
  const result = SpecterWallet.isRebalanceNeeded({ lndBalance, onChain })

  expect(result).toStrictEqual({ action: undefined })
})
