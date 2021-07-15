import _ from "lodash"
import { OnChainMixin } from "../OnChain"
import { WalletConstructorArgs } from "../types"
import { UserWallet } from "../userWallet"
import { btc2sat } from "../utils"

import { HedgingStrategies, IHedgingStrategy } from "./IHedgingStrategy"
import { createHedgingStrategy } from "./HedgingStrategyFactory"

// const activeStrategy = HedgingStrategies.FtxPerpetualSwap
const activeStrategy = HedgingStrategies.OkexPerpetualSwap

export class DealerWallet extends OnChainMixin(UserWallet) {
  strategy: IHedgingStrategy

  constructor({ user, logger }: WalletConstructorArgs) {
    super({ user, logger })
    this.strategy = createHedgingStrategy(activeStrategy, logger)
    this.logger = logger.child({ topic: "dealer" })
  }

  async updatePositionAndLeverage() {
    const logger = this.logger.child({ method: "updatePositionAndLeverage()" })
    const btcPriceInUsd = btc2sat(UserWallet.lastPrice)
    const { USD: usdBalance } = await this.getBalances()
    const usdLiability = Math.abs(usdBalance)

    if (usdLiability <= 0) {
      logger.debug({ msg: "No liabilities to hedge.", usdLiability: usdLiability })
      return
    }

    logger.debug("starting with order loop")

    const updatedPosition = await this.strategy.UpdatePosition(
      usdLiability,
      btcPriceInUsd,
    )
    if (updatedPosition.ok) {
      logger.info(
        `The active ${activeStrategy} strategy was successful at UpdatePosition()`,
      )
      logger.debug({
        msg: `Position BEFORE ${activeStrategy} strategy executed UpdatePosition()`,
        oldPosition: updatedPosition.value.oldPosition,
      })
      logger.debug({
        msg: `Position AFTER ${activeStrategy} strategy executed UpdatePosition()`,
        newPosition: updatedPosition.value.newPosition,
      })
    } else {
      logger.error({
        msg: `The active ${activeStrategy} strategy failed during the UpdatePosition() execution`,
        error: updatedPosition.error,
      })
    }

    logger.debug("starting with rebalance loop")

    ////////////////////////////////////////////////////////////////
    // TODO:
    ////////////////////////////////////////////////////////////////
    // Add a
    // withdraw() method
    // fetchDepositAddress()
    // rebalance(withdrawFunc, fetchDepositAddressFunc, {reBalanceData})
    //
    // !OR?
    // do we send back the withdrawFunc callback
    // and depositAddress in {reBalanceData} ?!?
    //
    // Convert UpdateLeverage()
    // to
    // {reBalanceData} = GetLeverageTransaction()
    // Calls rebalance(withdrawFunc, fetchDepositAddressFunc, {reBalanceData})
    ////////////////////////////////////////////////////////////////
    const updatedLeverage = await this.strategy.UpdateLeverage(
      usdLiability,
      btcPriceInUsd,
    )
    if (updatedLeverage.ok) {
      logger.info(
        `The active ${activeStrategy} strategy was successful at UpdateLeverage()`,
      )
      logger.debug({
        msg: `Position BEFORE ${activeStrategy} strategy executed UpdateLeverage()`,
        oldBalance: updatedLeverage.value.oldBalance,
      })
      logger.debug({
        msg: `Position AFTER ${activeStrategy} strategy executed UpdateLeverage()`,
        newBalance: updatedLeverage.value.newBalance,
      })
    } else {
      logger.error({
        msg: `The active ${activeStrategy} strategy failed during the UpdateLeverage() execution`,
        error: updatedLeverage.error,
      })
    }
  }
}
