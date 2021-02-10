/**
 * @jest-environment node
 */
import { SpecterWallet } from "../SpecterWallet";
import { btc2sat } from "../utils";

it('deposit amount calculation', async () => {
  const lndBalance = btc2sat(2)
  const result = SpecterWallet.isRebalanceNeeded({ lndBalance })

  // expect(result).toStrictEqual({action: "deposit", sats: 100000000 })  
})

it('withdraw amount calculation', async () => {
  const lndBalance = btc2sat(.5)
  const result = SpecterWallet.isRebalanceNeeded({ lndBalance })

  // expect(result).toStrictEqual({action: "withdraw", sats: 50000000 })  
})

it('not doing anything', async () => {
  const lndBalance = btc2sat(1)
  const result = SpecterWallet.isRebalanceNeeded({ lndBalance })

  // expect(result).toStrictEqual({action: undefined})  
})
