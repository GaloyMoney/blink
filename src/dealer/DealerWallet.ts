import { accountDealerFtxPath, liabilitiesDealerFtxPath } from "../ledger/ledger"
import { MainBook } from "../mongodb"
import { Result } from "./Result"
import { OnChainMixin } from "../OnChain"
import { WalletConstructorArgs } from "../types"
import { UserWallet } from "../userWallet"
import { btc2sat } from "../utils"
import { HedgingStrategies, HedgingStrategy } from "./HedgingStrategyTypes"
import { createHedgingStrategy } from "./HedgingStrategyFactory"

const activeStrategy = HedgingStrategies.FtxPerpetualSwap
// const activeStrategy = HedgingStrategies.OkexPerpetualSwap

export class DealerWallet extends OnChainMixin(UserWallet) {
  strategy: HedgingStrategy

  constructor({ user, logger }: WalletConstructorArgs) {
    super({ user, logger })
    this.strategy = createHedgingStrategy(activeStrategy, logger)
    this.logger = logger.child({ topic: "dealer" })
  }

  async updatePositionAndLeverage() {
    const logger = this.logger.child({ method: "updatePositionAndLeverage()" })
    const btcPriceInUsd = btc2sat(UserWallet.lastPrice)
    const { USD: usdBalance } = await this.getBalances()
    const usdLiability = -usdBalance

    // Testing for 0 is tricky, assuming we wont hedge change
    if (Math.abs(usdLiability) < 1) {
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

    const withdrawOnChainAddress = await this.getLastOnChainAddress()

    const updatedLeverage = await this.strategy.UpdateLeverage(
      usdLiability,
      btcPriceInUsd,
      withdrawOnChainAddress,
      this.withdrawBookKeeping,
      this.depositOnExchangeCallback,
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

  async depositOnExchangeCallback(
    onChainAddress,
    transferSizeInBtc: number,
  ): Promise<Result<null>> {
    try {
      const memo = `deposit of ${transferSizeInBtc} btc to ${this.ftx.name}`
      const transferSizeInSats = btc2sat(transferSizeInBtc)
      await this.onChainPay({ address: onChainAddress, amount: transferSizeInSats, memo })

      // onChainPay is doing:
      //
      // await MainBook.entry(memo)
      //   .credit(lndAccountingPath, sats, metadata)
      //   .debit(this.user.accountPath, sats, metadata)
      //   .commit()
      //
      // we're doing 2 transactions here on medici.
      // explore a way to refactor this to make a single transaction.
      const metadata = {
        type: "exchange_rebalance",
        currency: "BTC",
        ...UserWallet.getCurrencyEquivalent({ sats: transferSizeInSats, fee: 0 }),
      }

      await MainBook.entry()
        .credit(liabilitiesDealerFtxPath, transferSizeInSats, { ...metadata, memo })
        .debit(accountDealerFtxPath, transferSizeInSats, { ...metadata, memo })
        .commit()

      return { ok: true, value: null }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  async withdrawBookKeeping(transferSizeInBtc: number): Promise<Result<null>> {
    try {
      const memo = `withdrawal of ${transferSizeInBtc} btc from ${this.ftx.name}`
      const transferSizeInSats = btc2sat(transferSizeInBtc)

      // updateOnchainReceipt() doing:
      //
      // await MainBook.entry()
      // .credit(this.user.accountPath, sats, metadata)
      // .debit(lndAccountingPath, sats, metadata)
      // .commit()

      const metadata = {
        type: "exchange_rebalance",
        currency: "BTC",
        ...UserWallet.getCurrencyEquivalent({ sats: transferSizeInSats, fee: 0 }),
      }

      await MainBook.entry()
        .credit(accountDealerFtxPath, transferSizeInSats, { ...metadata, memo })
        .debit(liabilitiesDealerFtxPath, transferSizeInSats, { ...metadata, memo })
        .commit()

      return { ok: true, value: null }
    } catch (error) {
      return { ok: false, error: error }
    }
  }
}
