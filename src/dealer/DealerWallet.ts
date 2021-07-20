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
      logger.debug({ usdLiability }, "No liabilities to hedge.")
      return
    }

    logger.debug("starting with order loop")

    const updatedPosition = await this.strategy.UpdatePosition(
      usdLiability,
      btcPriceInUsd,
    )
    if (updatedPosition.ok) {
      const originalPosition = updatedPosition.value.originalPosition
      const newPosition = updatedPosition.value.newPosition

      logger.info(
        `The active ${activeStrategy} strategy was successful at UpdatePosition()`,
      )
      logger.debug(
        { originalPosition },
        `Position BEFORE ${activeStrategy} strategy executed UpdatePosition()`,
      )
      logger.debug(
        { newPosition },
        `Position AFTER ${activeStrategy} strategy executed UpdatePosition()`,
      )
    } else {
      logger.error(
        { updatedPosition },
        `The active ${activeStrategy} strategy failed during the UpdatePosition() execution`,
      )
    }

    logger.debug("starting with rebalance loop")

    const withdrawOnChainAddress = await this.getLastOnChainAddress()

    const updatedLeverageResult = await this.strategy.UpdateLeverage(
      usdLiability,
      btcPriceInUsd,
      withdrawOnChainAddress,
      this.withdrawBookKeeping,
      this.depositOnExchangeCallback,
    )
    if (updatedLeverageResult.ok) {
      const updatedLeverage = updatedLeverageResult.value
      logger.info(
        { updatedLeverage },
        `The active ${activeStrategy} strategy was successful at UpdateLeverage()`,
      )
    } else {
      logger.error(
        { updatedLeverageResult },
        `The active ${activeStrategy} strategy failed during the UpdateLeverage() execution`,
      )
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
