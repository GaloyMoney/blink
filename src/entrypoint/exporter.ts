import express from "express"
import { getChannelBalance, getChannels } from "lightning"
import client, { register } from "prom-client"
import { balanceSheetIsBalanced, getBalanceSheet } from "../ledger/balanceSheet"
import { getBosScore, lndBalances } from "../lndUtils"
import { setupMongoConnection } from "../mongodb"
import { Transaction, User } from "../schema"
import { baseLogger } from "../logger"
import { getDealerWallet, getFunderWallet } from "../walletFactory"
import { lnd } from "../lndConfig"
import { getBalancesDetail } from "../bitcoind"
import _ from "lodash"

const logger = baseLogger.child({ module: "exporter" })

const server = express()

const prefix = "galoy"

const liabilities_g = new client.Gauge({
  name: `${prefix}_liabilities`,
  help: "how much money customers has",
})
const lightning_g = new client.Gauge({
  name: `${prefix}_lightning`,
  help: "how much money there is our books for lnd",
})
const userCount_g = new client.Gauge({
  name: `${prefix}_userCount`,
  help: "how much users have registered",
})
const totalChannels_g = new client.Gauge({
  name: `${prefix}_totalChannels`,
  help: "total number of channels our node has",
})
const activeChannels_g = new client.Gauge({
  name: `${prefix}_activeChannels`,
  help: "number of active channels our node has",
})
const pendingHtlc_g = new client.Gauge({
  name: `${prefix}_pendingHtlcs`,
  help: "number of pending HTLC our node has",
})
const lnd_g = new client.Gauge({
  name: `${prefix}_lnd`,
  help: "how much money in our node",
})
const lndOnChain_g = new client.Gauge({
  name: `${prefix}_lnd_onchain`,
  help: "how much fund is onChain in lnd",
})
const lndOffChain_g = new client.Gauge({
  name: `${prefix}_lnd_offchain`,
  help: "how much fund is offChain in our node",
})
const lndOpeningChannelBalance_g = new client.Gauge({
  name: `${prefix}_lnd_openingchannelbalance`,
  help: "how much fund is pending following opening channel",
})
const lndClosingChannelBalance_g = new client.Gauge({
  name: `${prefix}_lnd_closingchannelbalance`,
  help: "how much fund is closing following force closed channel",
})
const receivingCapacity_g = new client.Gauge({
  name: `${prefix}_lnd_inboundcapacity`,
  help: "inbound capacity of the lightning node",
})
const usdShortPosition_g = new client.Gauge({
  name: `${prefix}_usdShortPosition`,
  help: "usd short position on ftx",
})
const totalAccountValue_g = new client.Gauge({
  name: `${prefix}_totalAccountValue`,
  help: "totalAccountValue on ftx",
})
const ftx_btc_g = new client.Gauge({
  name: `${prefix}_ftxBtcBalance`,
  help: "btc balance in ftx",
})
const ftx_usdPnl_g = new client.Gauge({
  name: `${prefix}_ftxUsdPnl`,
  help: "usd balance in FTX, which also represents the PNL",
})
const funder_balance_BTC_g = new client.Gauge({
  name: `${prefix}_funderBalance_BTC`,
  help: "funder balance BTC",
})
const dealer_local_btc_g = new client.Gauge({
  name: `${prefix}_dealerLocalBtcBalance`,
  help: "btc balance in for the dealer in the node",
})
const dealer_local_usd_g = new client.Gauge({
  name: `${prefix}_dealerLocalUsdBalance`,
  help: "usd liabilities for the dealer",
})
const dealer_profit_g = new client.Gauge({
  name: `${prefix}_dealerProfit`,
  help: "profit of the dealer wallet",
})
const leverage_g = new client.Gauge({
  name: `${prefix}_leverage`,
  help: "leverage ratio on ftx",
})
const fundingRate_g = new client.Gauge({
  name: `${prefix}_fundingRate`,
  help: "FTX hourly funding rate",
})
const assetsLiabilitiesDifference_g = new client.Gauge({
  name: `${prefix}_assetsEqLiabilities`,
  help: "do we have a balanced book",
})
const bookingVersusRealWorldAssets_g = new client.Gauge({
  name: `${prefix}_lndBalanceSync`,
  help: "are lnd in syncs with our books",
})
const bos_g = new client.Gauge({ name: `${prefix}_bos`, help: "bos score" })
const bitcoin_g = new client.Gauge({
  name: `${prefix}_bitcoin`,
  help: "amount in accounting for cold storage",
})
const business_g = new client.Gauge({
  name: `${prefix}_business`,
  help: "number of businesses in the app",
})
const onchainWithdrawFees_g = new client.Gauge({
  name: `${prefix}_onchainWithdrawFees`,
  help: "onchain withdraw fees collected",
})
const onchainDepositFees_g = new client.Gauge({
  name: `${prefix}_onchainDepositFees`,
  help: "onchain deposit fees collected",
})

const main = async () => {
  server.get("/metrics", async (req, res) => {
    const bosScore = await getBosScore()
    bos_g.set(bosScore)

    const { lightning, liabilities, bitcoin } = await getBalanceSheet()
    liabilities_g.set(liabilities)
    lightning_g.set(lightning)
    bitcoin_g.set(bitcoin)

    try {
      const { assetsLiabilitiesDifference, bookingVersusRealWorldAssets } =
        await balanceSheetIsBalanced()
      assetsLiabilitiesDifference_g.set(assetsLiabilitiesDifference)
      bookingVersusRealWorldAssets_g.set(bookingVersusRealWorldAssets)
    } catch (err) {
      logger.error({ err }, "impossible to calculate balance sheet")
    }

    const { total, onChain, offChain, opening_channel_balance, closing_channel_balance } =
      await lndBalances()
    lnd_g.set(total)
    lndOnChain_g.set(onChain)
    lndOffChain_g.set(offChain)
    lndOpeningChannelBalance_g.set(opening_channel_balance)
    lndClosingChannelBalance_g.set(closing_channel_balance)
    // price_g.set(price)

    const userCount = await User.countDocuments()
    userCount_g.set(userCount)

    const funderWallet = await getFunderWallet({ logger })
    const { BTC: funderBalance } = await funderWallet.getBalances()
    funder_balance_BTC_g.set(funderBalance)

    const dealerWallet = await getDealerWallet({ logger })

    try {
      const {
        usd: usdShortPosition,
        totalAccountValue,
        leverage,
      } = await dealerWallet.getAccountPosition()

      ftx_btc_g.set((await dealerWallet.getExchangeBalance()).sats)
      ftx_usdPnl_g.set((await dealerWallet.getExchangeBalance()).usdPnl)
      dealer_local_btc_g.set((await dealerWallet.getLocalLiabilities()).satsLnd)
      dealer_local_usd_g.set((await dealerWallet.getLocalLiabilities()).usd)
      dealer_profit_g.set((await dealerWallet.getProfit()).usdProfit)
      totalAccountValue_g.set(totalAccountValue)
      usdShortPosition_g.set(usdShortPosition)
      leverage_g.set(leverage)
      fundingRate_g.set(await dealerWallet.getNextFundingRate())
    } catch (error) {
      logger.error("Couldn't set dealer wallet metrics")
    }

    business_g.set(await User.count({ title: { $exists: true } }))

    const { channels } = await getChannels({ lnd })
    totalChannels_g.set(channels.length)
    activeChannels_g.set(channels.filter((channel) => channel.is_active).length)
    pendingHtlc_g.set(_.sum(channels.map((channel) => channel.pending_payments.length)))

    const { inbound } = await getChannelBalance({ lnd })
    receivingCapacity_g.set(inbound ?? 0)

    try {
      const balances = await getBalancesDetail()
      for (const { wallet, balance } of balances) {
        const walletSanitized = wallet.replace("/", "_")
        const gauge = new client.Gauge({
          name: `${prefix}_bitcoind_${walletSanitized}`,
          help: `amount in wallet ${wallet}`,
        })
        gauge.set(balance)
      }
    } catch (err) {
      logger.error({ err }, "error setting bitcoind/specter balance")
    }

    const [depositFeeEntry] = await Transaction.aggregate([
      { $match: { accounts: "Revenue:Bitcoin:Fees", type: "onchain_receipt" } },
      { $group: { _id: null, totalDepositFees: { $sum: "$credit" } } },
    ])
    const { totalDepositFees = 0 } = depositFeeEntry || {}
    onchainDepositFees_g.set(totalDepositFees)

    const [withdrawFeeEntry] = await Transaction.aggregate([
      { $match: { accounts: "Revenue:Bitcoin:Fees", type: "onchain_payment" } },
      { $group: { _id: null, totalWithdrawFees: { $sum: "$credit" } } },
    ])
    const { totalWithdrawFees = 0 } = withdrawFeeEntry || {}
    onchainWithdrawFees_g.set(totalWithdrawFees)

    res.set("Content-Type", register.contentType)
    res.end(register.metrics())
  })

  server.get("/healthz", async (req, res) => {
    res.send("OK")
  })

  const port = process.env.PORT || 3000
  logger.info(`Server listening to ${port}, metrics exposed on /metrics endpoint`)
  server.listen(port)
}

setupMongoConnection()
  .then(() => main())
  .catch((err) => logger.error(err))
