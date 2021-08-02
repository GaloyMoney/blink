import express from "express"
import client, { register } from "prom-client"

import { getBalancesDetail } from "@services/bitcoind"
import { getBosScore, lndsBalances } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"
import { User } from "@services/mongoose/schema"

import { getWalletFromRole } from "@core/wallet-factory"
import { balanceSheetIsBalanced, getLedgerAccounts } from "@core/balance-sheet"

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

const roles = ["dealer", "funder", "bankowner"]
const wallet_roles = {}

for (const role in roles) {
  wallet_roles[role] = new client.Gauge({
    name: `${prefix}_${role}_balance`,
    help: "funder balance BTC",
  })
}

// const bankOwner_g = new client.Gauge({
//   name: `${prefix}_bankOwnerBalance`,
//   help: "sats amount for the bank owner",
// })

const main = async () => {
  server.get("/metrics", async (req, res) => {
    const bosScore = await getBosScore()
    bos_g.set(bosScore)

    const { lightning, liabilities, bitcoin } = await getLedgerAccounts()
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
      await lndsBalances()
    lnd_g.set(total)
    lndOnChain_g.set(onChain)
    lndOffChain_g.set(offChain)
    lndOpeningChannelBalance_g.set(opening_channel_balance)
    lndClosingChannelBalance_g.set(closing_channel_balance)

    const userCount = await User.countDocuments()
    userCount_g.set(userCount)

    for (const role of roles) {
      try {
        const wallet = await getWalletFromRole({ role, logger })
        const { BTC: balance } = await wallet.getBalances()
        wallet_roles[role].set(balance)
      } catch (err) {
        baseLogger.error({ role }, `can't fetch balance for role`)
      }
    }

    business_g.set(await User.count({ title: { $exists: true } }))

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

    res.set("Content-Type", register.contentType)
    res.end(await register.metrics())
  })

  server.get("/healthz", (req, res) => {
    res.send("OK")
  })

  const port = process.env.PORT || 3000
  logger.info(`Server listening to ${port}, metrics exposed on /metrics endpoint`)
  await server.listen(port)
}

setupMongoConnection()
  .then(() => main())
  .catch((err) => logger.error(err))
