import { redis } from "src/redis"
import { FtxDealerWallet } from "src/dealer/FtxDealerWallet"

beforeAll(async () => {
  // avoids to use --forceExit and the need of a running redis
  redis.disconnect()
})

describe("FtxDealerWallet", () => {
  describe("isOrderNeeded", () => {
    it("calculates initial order", async () => {
      const { btcAmount, buyOrSell } = FtxDealerWallet.isOrderNeeded({
        usdLiability: 100,
        usdExposure: 0,
        btcPrice: 10000,
      })
      // we should sell to have $98 short position
      expect(buyOrSell).toBe("sell")
      expect(btcAmount).toBe(0.0098)
    })

    it("calculates hedging amount when under exposed", async () => {
      // ratio is a .5
      // need to be at .98
      // should buy $480/0.048 BTC
      const { btcAmount, buyOrSell } = FtxDealerWallet.isOrderNeeded({
        usdLiability: 1000,
        usdExposure: 500,
        btcPrice: 10000,
      })
      expect(buyOrSell).toBe("sell")
      expect(btcAmount).toBe(0.048)
    })

    it("calculates hedging amount when over exposed", async () => {
      // ratio is a 2
      // need to be at HIGH_SAFEBOUND_RATIO_SHORTING (1.00)
      // should sell $1000/0.1 BTC to have exposure being back at $1000
      const { btcAmount, buyOrSell } = FtxDealerWallet.isOrderNeeded({
        usdLiability: 1000,
        usdExposure: 2000,
        btcPrice: 10000,
      })
      expect(buyOrSell).toBe("buy")
      expect(btcAmount).toBe(0.1)

      {
        // {"usdExposure":92.136,"usdLiability":40.31493016,"leverage":2.155660936095568,"btcPrice":11517,"btcAmount":0.004499528509160371,"buyOrSell":"buy","msg":"isOrderNeeded result"}
        const { btcAmount, buyOrSell } = FtxDealerWallet.isOrderNeeded({
          usdLiability: 40.31493016,
          usdExposure: 92.136,
          btcPrice: 11517,
        })
        expect(buyOrSell).toBe("buy")
        expect(btcAmount).toBeCloseTo(0.00449952, 6)
      }
    })

    it("calculates hedging when no rebalance is needed", async () => {
      const { buyOrSell } = FtxDealerWallet.isOrderNeeded({
        usdLiability: 1000,
        usdExposure: 1000,
        btcPrice: 10000,
      })
      expect(buyOrSell).toBeNull()
    })

    it("returns null when order is not needed", async () => {
      // "updatedUsdLiability":40.31493016,"updatedUsdExposure":41.4612,"btcPrice":11517
      const { buyOrSell } = FtxDealerWallet.isOrderNeeded({
        usdLiability: 40.31493016,
        usdExposure: 41.4612,
        btcPrice: 11517,
      })
      expect(buyOrSell).toBeNull()
    })
  })

  describe("isOrderNeeded", () => {
    it("returns null when account has been initialized", async () => {
      // "leverage":null,"collateral":0,"btcPrice":11378,
      const { depositOrWithdraw } = FtxDealerWallet.isRebalanceNeeded({
        usdLiability: 0,
        btcPrice: 10000,
        usdCollateral: 0,
      })
      expect(depositOrWithdraw).toBe(null)
    })

    it("test first deposit", async () => {
      // "leverage":null,"collateral":0,"btcPrice":11378,
      const { btcAmount, depositOrWithdraw } = FtxDealerWallet.isRebalanceNeeded({
        usdLiability: 1000,
        btcPrice: 10000,
        usdCollateral: 0,
      })
      expect(depositOrWithdraw).toBe("deposit")
      expect(btcAmount).toBeCloseTo(0.04444) // $1000 / leverage (2.25) / price
    })

    // leverage 5x
    it("test over leverage", async () => {
      const { btcAmount, depositOrWithdraw } = FtxDealerWallet.isRebalanceNeeded({
        usdLiability: 1000,
        btcPrice: 10000,
        usdCollateral: 200,
      })
      expect(depositOrWithdraw).toBe("deposit")
      // deposit $244 go to $444
      expect(btcAmount).toBeCloseTo(0.0244)
    })

    // leverage 1.25
    it("test under leverage", async () => {
      const { btcAmount, depositOrWithdraw } = FtxDealerWallet.isRebalanceNeeded({
        usdLiability: 1000,
        btcPrice: 10000,
        usdCollateral: 900,
      })
      expect(depositOrWithdraw).toBe("withdraw")
      // withdraw $345 to go from $900 to $555 (1000/1.8)
      expect(btcAmount).toBeCloseTo(0.0345)
    })

    // leverage 0.35x
    it("test outrageously under leverage", async () => {
      const { btcAmount, depositOrWithdraw } = FtxDealerWallet.isRebalanceNeeded({
        usdLiability: 1000,
        btcPrice: 10000,
        usdCollateral: 2800,
      })
      expect(depositOrWithdraw).toBe("withdraw")
      // withdral to be at $555
      expect(btcAmount).toBeCloseTo(0.2245)
    })

    it("test no action", async () => {
      const { depositOrWithdraw } = FtxDealerWallet.isRebalanceNeeded({
        usdLiability: 1000,
        btcPrice: 10000,
        usdCollateral: 500,
      })
      expect(depositOrWithdraw).toBeNull()
    })
  })
})
