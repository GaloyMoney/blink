/**
 * @jest-environment node
 */
import { BrokerWallet } from "../BrokerWallet";

it('isRebalanceNeeded test under leverage', async () => {
  const { btcAmount, depositOrWithdraw } = BrokerWallet.isRebalanceNeeded({leverage: 0.8, usdCollateral: 1000, btcPrice: 10000})
  expect(depositOrWithdraw).toBe("withdraw")
  // withdraw 0.0694 to go from 0.8 to 1.8 leverage
  expect(btcAmount).toBeCloseTo(((1000 / .8) - (1000 / 1.8))/ 10000) 
})

it('isRebalanceNeeded test over leverage', async () => {
  const { btcAmount, depositOrWithdraw } = BrokerWallet.isRebalanceNeeded({leverage: 2.8, usdCollateral: 1000, btcPrice: 10000})
  expect(depositOrWithdraw).toBe("deposit")
  // deposit 0.0054 to go from 2.5 to 2.2 leverage
  expect(btcAmount).toBeCloseTo(((1000 / 2.2) - (1000 / 2.5))/ 10000) 
})

it('isRebalanceNeeded test no action', async () => {
  {
    const { btcAmount, depositOrWithdraw } = BrokerWallet.isRebalanceNeeded({leverage: 1.6, usdCollateral: 1000, btcPrice: 10000})
    expect(depositOrWithdraw).toBeNull()
  }
  
  {
    const { btcAmount, depositOrWithdraw } = BrokerWallet.isRebalanceNeeded({leverage: 2.1, usdCollateral: 1000, btcPrice: 10000})
    expect(depositOrWithdraw).toBeNull()
  }
})

it('calculate hedging amount when over exposed', async () => {
  // ratio is a .5
  // need to be at .9
  // should buy $400/0.04 BTC
  const { btcAmount, buyOrSell } = BrokerWallet.isOrderNeeded({ usdLiability: 1000, usdExposure: 500, btcPrice: 10000 })
  expect(buyOrSell).toBe("buy")
  expect(btcAmount).toBe(0.04)
})

it('calculate hedging amount when under exposed', async () => {
  // ratio is a 2
  // need to be at 1.1
  // should sell $450/0.045 BTC to have exposure being back at $600
  const { btcAmount, buyOrSell } = BrokerWallet.isOrderNeeded({ usdLiability: 500, usdExposure: 1000, btcPrice: 10000 })
  expect(buyOrSell).toBe("sell")
  expect(btcAmount).toBe(0.045)
})

it('calculate hedging when no rebalance is needed', async () => {
  const { btcAmount, buyOrSell } = BrokerWallet.isOrderNeeded({ usdLiability: 950, usdExposure: 1000, btcPrice: 10000 })
  expect(buyOrSell).toBeNull()
})
