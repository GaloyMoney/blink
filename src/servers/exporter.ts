import express from "express"
import sumBy from "lodash.sumby"
import client, { register } from "prom-client"

import { SECS_PER_5_MINS } from "@config"

import { ColdStorage, Lightning } from "@app"

import { toSeconds } from "@domain/primitives"

import {
  asyncRunInSpan,
  addAttributesToCurrentSpan,
  wrapAsyncToRunInSpan,
  recordExceptionInCurrentSpan,
} from "@services/tracing"
import {
  getBankOwnerWalletId,
  getDealerBtcWalletId,
  getDealerUsdWalletId,
  getFunderWalletId,
} from "@services/ledger/caching"
import { LndService } from "@services/lnd"
import { baseLogger } from "@services/logger"
import { LedgerService } from "@services/ledger"
import { Account } from "@services/mongoose/schema"
import { LocalCacheService } from "@services/cache"
import { activateLndHealthCheck } from "@services/lnd/health"
import { ledgerAdmin, setupMongoConnection } from "@services/mongodb"

import { timeout } from "@utils"

import healthzHandler from "./middlewares/healthz"

const TIMEOUT_WALLET_BALANCE = 30000

const logger = baseLogger.child({ module: "exporter" })

const prefix = "galoy"

const main = async () => {
  const { getLiabilitiesBalance, getLndBalance, getBitcoindBalance } = ledgerAdmin
  createGauge({
    name: "liabilities",
    description: "how much money customers has",
    collect: getLiabilitiesBalance,
  })

  createGauge({
    name: "lightning",
    description: "how much money there is our books for lnd",
    collect: getLndBalance,
  })

  createGauge({
    name: "userCount",
    description: "how much users have registered",
    collect: async () => {
      const value = await Account.countDocuments()
      return value
    },
  })

  createGauge({
    name: "lnd",
    description: "how much money in our node",
    collect: async () => {
      const balance = await Lightning.getTotalBalance()
      if (balance instanceof Error) return 0

      return balance
    },
  })

  createGauge({
    name: "lnd_onchain",
    description: "how much fund is onChain in our nodes",
    collect: async () => {
      const balance = await Lightning.getOnChainBalance()
      if (balance instanceof Error) return 0

      return balance
    },
  })

  createGauge({
    name: "lnd_offchain",
    description: "how much fund is offChain in our nodes",
    collect: async () => {
      const balance = await Lightning.getOffChainBalance()
      if (balance instanceof Error) return 0

      return balance
    },
  })

  createGauge({
    name: "lnd_openingchannelbalance",
    description: "how much fund is pending following opening channel",
    collect: async () => {
      const balance = await Lightning.getOpeningChannelBalance()
      if (balance instanceof Error) return 0

      return balance
    },
  })

  createGauge({
    name: "lnd_closingchannelbalance",
    description: "how much fund is closing following force closed channel",
    collect: async () => {
      const balance = await Lightning.getClosingChannelBalance()
      if (balance instanceof Error) return 0

      return balance
    },
  })

  createGauge({
    name: "assetsEqLiabilities",
    description: "do we have a balanced book",
    collect: getAssetsLiabilitiesDifference,
  })

  createGauge({
    name: "lndBalanceSync",
    description: "are lnd in syncs with our books",
    collect: getBookingVersusRealWorldAssets,
  })

  createGauge({
    name: "bitcoin",
    description: "amount in accounting for cold storage",
    collect: getBitcoindBalance,
  })

  createGauge({
    name: "business",
    description: "number of businesses in the app",
    collect: async () => {
      const value = await Account.countDocuments({ title: { $ne: undefined } })
      return value
    },
  })

  const galoyWallets = [
    { name: "dealer_btc", getId: getDealerBtcWalletId },
    { name: "dealer_usd", getId: getDealerUsdWalletId },
    { name: "funder", getId: getFunderWalletId },
    { name: "bankowner", getId: getBankOwnerWalletId },
  ]
  for (const wallet of galoyWallets) {
    createWalletGauge({ walletName: wallet.name, getId: wallet.getId })
  }

  const coldStorageWallets = await getColdStorageWallets()
  for (const walletName of coldStorageWallets) {
    createColdStorageWalletGauge(walletName)
  }

  const server = express()
  server.get("/metrics", async (req, res) =>
    asyncRunInSpan("metrics", {}, async () => {
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
  server.listen(port, () => {
    logger.info(`Server listening to ${port}, metrics exposed on /metrics endpoint`)
  })
  activateLndHealthCheck()
}

setupMongoConnection()
  .then(() => main())
  .catch((err) => logger.error(err))

const createGauge = ({
  name,
  description,
  collect,
}: {
  name: string
  description: string
  collect: () => Promise<number>
}) => {
  const collectFn = wrapAsyncToRunInSpan({
    namespace: "exporter",
    fnName: name,
    fn: collect,
  })
  return new client.Gauge({
    name: `${prefix}_${name}`,
    help: description,
    async collect() {
      const value = await collectFn()
      addAttributesToCurrentSpan({ [`${name}_value`]: `${value}` })
      this.set(value)
    },
  })
}

const cache = LocalCacheService()
const createWalletGauge = ({
  walletName,
  getId,
}: {
  walletName: string
  getId: () => Promise<WalletId>
}) => {
  const name = `${walletName}_balance`
  const description = `${walletName} balance`

  return createGauge({
    name,
    description,
    collect: async () => {
      const getWalletBalancePromise = async () => {
        const walletId = await getId()
        return getWalletBalance(walletId)
      }
      try {
        const timeoutPromise = timeout(TIMEOUT_WALLET_BALANCE, "Timeout")
        const balance = (await Promise.race([
          getWalletBalancePromise(),
          timeoutPromise,
        ])) as number

        await cache.set<number>({
          key: name,
          value: balance,
          ttlSecs: toSeconds(SECS_PER_5_MINS * 3),
        })

        return balance
      } catch (err) {
        logger.error({ err }, `Could not load wallet id for ${walletName}.`)

        if (err.message === "Timeout")
          logger.info(`Getting ${walletName} wallet balance from cache.`)

        return cache.getOrSet({
          key: name,
          ttlSecs: toSeconds(SECS_PER_5_MINS * 3),
          getForCaching: getWalletBalancePromise,
        })
      }
    },
  })
}

const getWalletBalance = async (walletId: WalletId): Promise<number> => {
  const walletBalance = await LedgerService().getWalletBalance(walletId)
  if (walletBalance instanceof Error) {
    logger.warn({ walletId, walletBalance }, "impossible to get balance")
    return 0
  }

  return walletBalance
}

const getColdStorageWallets = async (): Promise<string[]> => {
  const coldStorageWallets = await ColdStorage.listWallets()
  if (coldStorageWallets instanceof Error) {
    recordExceptionInCurrentSpan({ error: coldStorageWallets })
    return []
  }

  return coldStorageWallets
}

const getColdStorageBalance = async (): Promise<number> => {
  const balances = await ColdStorage.getBalances()
  if (balances instanceof Error) {
    recordExceptionInCurrentSpan({ error: balances })
    return 0
  }

  return sumBy(balances, "amount")
}

const createColdStorageWalletGauge = (walletName: string) => {
  const walletNameSanitized = walletName.replace("/", "_")
  const name = `bitcoind_${walletNameSanitized}`
  const description = `amount in wallet ${walletNameSanitized}`
  return createGauge({
    name,
    description,
    collect: async () => {
      const balance = await ColdStorage.getBalance(walletName)
      if (balance instanceof Error) {
        logger.error({ walletName }, "error getting bitcoind/specter balance")
        return 0
      }
      return balance.amount
    },
  })
}

const getAssetsLiabilitiesDifference = async () => {
  const [assets, liabilities] = await Promise.all([
    ledgerAdmin.getAssetsBalance(),
    ledgerAdmin.getLiabilitiesBalance(),
  ])

  return assets + liabilities
}

export const getBookingVersusRealWorldAssets = async () => {
  const [lightning, bitcoin, lndBalance, bitcoind] = await Promise.all([
    ledgerAdmin.getLndBalance(),
    ledgerAdmin.getBitcoindBalance(),
    Lightning.getTotalBalance(),
    getColdStorageBalance(),
  ])

  const lnd = lndBalance instanceof Error ? 0 : lndBalance

  return (
    lnd + // physical assets
    bitcoind + // physical assets
    (lightning + bitcoin)
  ) // value in accounting
}

createGauge({
  name: "totalPendingHtlcCount",
  description: "How many pending HTLCs there are in the channels of the active nodes",
  collect: async () => {
    const lndService = LndService()
    if (lndService instanceof Error) return NaN
    const totalPendingHtlcCount = await lndService.getTotalPendingHtlcCount()
    if (totalPendingHtlcCount instanceof Error) throw totalPendingHtlcCount
    return totalPendingHtlcCount
  },
})

createGauge({
  name: "activeChannels",
  description: "How many active channels there are on the active nodes",
  collect: async () => {
    const lndService = LndService()
    if (lndService instanceof Error) return NaN
    const activeChannels = await lndService.getActiveChannels()
    if (activeChannels instanceof Error) throw activeChannels
    return activeChannels
  },
})

createGauge({
  name: "offlineChannels",
  description: "How many offline channels there are on the active nodes",
  collect: async () => {
    const lndService = LndService()
    if (lndService instanceof Error) return NaN
    const offlineChannels = await lndService.getOfflineChannels()
    if (offlineChannels instanceof Error) throw offlineChannels
    return offlineChannels
  },
})

createGauge({
  name: "publicChannels",
  description: "How many public channels there are on the active nodes",
  collect: async () => {
    const lndService = LndService()
    if (lndService instanceof Error) return NaN
    const publicChannels = await lndService.getPublicChannels()
    if (publicChannels instanceof Error) throw publicChannels
    return publicChannels
  },
})

createGauge({
  name: "privateChannels",
  description: "How many private channels there are on the active nodes",
  collect: async () => {
    const lndService = LndService()
    if (lndService instanceof Error) return NaN
    const privateChannels = await lndService.getPrivateChannels()
    if (privateChannels instanceof Error) throw privateChannels
    return privateChannels
  },
})

createGauge({
  name: "inboundBalance",
  description: "How much inbound balance there is on the active nodes",
  collect: async () => {
    const balance = await Lightning.getInboundBalance()
    if (balance instanceof Error) return NaN
    return balance
  },
})

createGauge({
  name: "outboundBalance",
  description: "How much outbound balance there is on the active nodes",
  collect: async () => {
    const balance = await Lightning.getOutboundBalance()
    if (balance instanceof Error) return NaN
    return balance
  },
})
