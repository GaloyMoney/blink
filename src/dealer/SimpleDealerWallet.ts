import _ from "lodash"
import { OnChainMixin } from "../OnChain"
import { ILightningWalletUser } from "../types"
import { UserWallet } from "../userWallet"
import { btc2sat } from "../utils"

import { HedgingStrategies, IHedgingStrategy } from "./IHedgingStrategy"
import { createHedgingStrategy } from "./HedgingStrategyFactory"

const activeStrategy = HedgingStrategies.FtxPerpetualSwap

export class SimpleDealerWallet extends OnChainMixin(UserWallet) {
  strategy: IHedgingStrategy

  constructor({ user, logger }: ILightningWalletUser) {
    super({ user, logger })
    this.strategy = createHedgingStrategy(activeStrategy, logger)
    this.logger = logger.child({ topic: "dealer" })
  }

  async updatePositionAndLeverage() {
    const logger = this.logger.child({ method: "updatePositionAndLeverage()" })
    const btcPriceInUsd = btc2sat(UserWallet.lastPrice)
    const { USD: usdBalance } = await this.getBalances()
    const usdLiability = -usdBalance

    logger.debug("starting with order loop")

    const updatedPosition = await this.strategy.UpdatePosition(
      usdLiability,
      btcPriceInUsd,
    )
    if (updatedPosition.ok) {
      logger.info(
        `The active ${activeStrategy} strategy was successful at UpdatePosition()`,
      )
      logger.debug(
        `Position BEFORE ${activeStrategy} strategy executed UpdatePosition(): ${updatedPosition.value.oldPosition}`,
      )
      logger.debug(
        `Position AFTER ${activeStrategy} strategy executed UpdatePosition(): ${updatedPosition.value.newPosition}`,
      )
    } else {
      logger.error(
        `The active ${activeStrategy} strategy failed during the UpdatePosition() execution: ${updatedPosition.error}`,
      )
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
      logger.debug(
        `Position BEFORE ${activeStrategy} strategy executed UpdateLeverage(): ${updatedLeverage.value.oldBalance}`,
      )
      logger.debug(
        `Position AFTER ${activeStrategy} strategy executed UpdateLeverage(): ${updatedLeverage.value.newBalance}`,
      )
    } else {
      logger.error(
        `The active ${activeStrategy} strategy failed during the UpdateLeverage() execution: ${updatedLeverage.error}`,
      )
    }
  }
}
