import { ColdStorage } from "@app"
import { asyncRunInSpan, addAttributesToCurrentSpan } from "@services/tracing"
import { balanceSheetIsBalanced, getLedgerAccounts } from "@core/balance-sheet"
import { toSats } from "@domain/bitcoin"
import { LedgerService } from "@services/ledger"
import {
  getBankOwnerWalletId,
  getDealerBtcWalletId,
  getDealerUsdWalletId,
  getFunderWalletId,
} from "@services/ledger/caching"
import { activateLndHealthCheck } from "@services/lnd/health"
import { getBosScore, lndsBalances } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"
import { User } from "@services/mongoose/schema"
import express from "express"
import client, { register } from "prom-client"

import healthzHandler from "./middlewares/healthz"

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

const walletsInit = [
  { name: "dealer_btc", getId: getDealerBtcWalletId },
  { name: "dealer_usd", getId: getDealerUsdWalletId },
  { name: "funder", getId: getFunderWalletId },
  { name: "bankowner", getId: getBankOwnerWalletId },
]
const wallets = walletsInit.map((wallet) => ({
  gauge: new client.Gauge({
    name: `${prefix}_${wallet.name}_balance`,
    help: `${wallet.name}`,
  }),
  ...wallet,
}))

const coldWallets: { [key: string]: client.Gauge<string> } = {}

const main = async () => {
  server.get("/metrics", async (req, res) =>
    asyncRunInSpan("metrics", {}, async () => {
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

      const {
        total,
        onChain,
        offChain,
        opening_channel_balance,
        closing_channel_balance,
      } = await lndsBalances()
      lnd_g.set(total)
      lndOnChain_g.set(onChain)
      lndOffChain_g.set(offChain)
      lndOpeningChannelBalance_g.set(opening_channel_balance)
      lndClosingChannelBalance_g.set(closing_channel_balance)

      const userCount = await User.countDocuments()
      userCount_g.set(userCount)

      for (const wallet of wallets) {
        let walletId
        try {
          walletId = await wallet.getId()
        } catch (err) {
          baseLogger.error({ err }, `Could not load wallet id for ${wallet.name}`)
          continue
        }

        let balance: CurrencyBaseAmount

        const walletBalance = await LedgerService().getWalletBalance(walletId)
        if (walletBalance instanceof Error) {
          baseLogger.warn({ walletId, walletBalance }, "impossible to get balance")
          balance = toSats(0)
        } else {
          balance = walletBalance
          addAttributesToCurrentSpan({
            [`${wallet.name}_balance`]: balance,
          })
        }

        wallet.gauge.set(balance)
      }

      business_g.set(await User.count({ title: { $ne: undefined } }))

      try {
        let balances = await ColdStorage.getBalances()
        if (balances instanceof Error) balances = []
        for (const { walletName, amount } of balances) {
          const walletSanitized = walletName.replace("/", "_")
          if (!coldWallets[walletSanitized]) {
            coldWallets[walletSanitized] = new client.Gauge({
              name: `${prefix}_bitcoind_${walletSanitized}`,
              help: `amount in wallet ${walletName}`,
            })
            addAttributesToCurrentSpan({
              [`${prefix}_bitcoind_${walletSanitized}`]: amount,
            })
          }
          coldWallets[walletSanitized].set(amount)
        }
      } catch (err) {
        logger.error({ err }, "error setting bitcoind/specter balance")
      }

      res.set("Content-Type", register.contentType)
      res.end(await register.metrics())
    }),
  )
  server.get(
    "/healthz",
    healthzHandler({
      checkDbConnectionStatus: true,
      checkRedisStatus: false,
      checkLndsStatus: true,
    }),
  )

  const port = process.env.PORT || 3000
  logger.info(`Server listening to ${port}, metrics exposed on /metrics endpoint`)
  await server.listen(port)
  activateLndHealthCheck()
}

setupMongoConnection()
  .then(() => main())
  .catch((err) => logger.error(err))
