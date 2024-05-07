import express from "express"
import client, { register } from "prom-client"

import healthzHandler from "./middlewares/healthz"

import { EXPORTER_ASSETS_LIABILITIES_DELAY_SECS, EXPORTER_PORT, SECS_PER_5_MINS } from "@/config"

import { Lightning, OnChain } from "@/app"

import { toSeconds } from "@/domain/primitives"

import {
  asyncRunInSpan,
  addAttributesToCurrentSpan,
  wrapAsyncToRunInSpan,
} from "@/services/tracing"
import {
  getBankOwnerWalletId,
  getDealerBtcWalletId,
  getDealerUsdWalletId,
  getFunderWalletId,
} from "@/services/ledger/caching"
import { LndService } from "@/services/lnd"
import { baseLogger } from "@/services/logger"
import { LedgerService } from "@/services/ledger"
import { LocalCacheService } from "@/services/cache"
import { activateLndHealthCheck } from "@/services/lnd/health"
import { ledgerAdmin, setupMongoConnection } from "@/services/mongodb"

import { timeoutWithCancel } from "@/utils"

const TIMEOUT_WALLET_BALANCE = 30000

const logger = baseLogger.child({ module: "exporter" })

const prefix = "galoy"

const main = async () => {
  const { getLiabilitiesBalance, getLndBalance, getBitcoindBalance, getOnChainBalance } =
    ledgerAdmin
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
    name: "onchain",
    description: "amount in books for OnChain account",
    collect: getOnChainBalance,
  })

  createGauge({
    name: "bria_hot",
    description: "how much funds are onChain in bria managed wallets",
    collect: async () => {
      const balance = await OnChain.getHotBalance()
      if (balance instanceof Error) return 0

      return Number(balance.amount)
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

  createColdStorageWalletGauge()

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
      checkBriaStatus: false,
    }),
  )

  const port = EXPORTER_PORT
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

      let cancelTimeout = () => {
        return
      }
      try {
        const [timeoutPromise, cancelTimeoutFn] = timeoutWithCancel(
          TIMEOUT_WALLET_BALANCE,
          "Timeout",
        )
        cancelTimeout = cancelTimeoutFn

        const balance = (await Promise.race([
          getWalletBalancePromise(),
          timeoutPromise,
        ])) as number
        cancelTimeout()

        await cache.set<number>({
          key: name,
          value: balance,
          ttlSecs: toSeconds(SECS_PER_5_MINS * 3),
        })

        return balance
      } catch (err) {
        logger.error({ err }, `Could not load wallet id for ${walletName}.`)

        if (err instanceof Error && err.message === "Timeout") {
          logger.info(`Getting ${walletName} wallet balance from cache.`)
        }
        cancelTimeout()

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

const createColdStorageWalletGauge = () => {
  const name = `bria_cold_storage`
  const description = `amount in wallet ${name}`
  return createGauge({
    name,
    description,
    collect: async () => {
      const balance = await OnChain.getColdBalance()
      if (balance instanceof Error) {
        logger.error(`error getting ${name} balance`)
        return 0
      }
      return Number(balance.amount)
    },
  })
}

const getAssetsLiabilitiesDifference = async () => {
  const currentDate = new Date()
  currentDate.setSeconds(currentDate.getSeconds() - EXPORTER_ASSETS_LIABILITIES_DELAY_SECS)
  const [assets, liabilities] = await Promise.all([
    ledgerAdmin.getAssetsBalance(currentDate),
    ledgerAdmin.getLiabilitiesBalance(currentDate),
  ])

  return assets + liabilities
}

export const getBookingVersusRealWorldAssets = async () => {
  const [lightning, bitcoin, onChain, lndBalance, coldStorage, hotBalance] =
    await Promise.all([
      ledgerAdmin.getLndBalance(),
      ledgerAdmin.getBitcoindBalance(),
      ledgerAdmin.getOnChainBalance(),
      Lightning.getTotalBalance(),
      OnChain.getColdBalance(),
      OnChain.getHotBalance(),
    ])

  const lnd = lndBalance instanceof Error ? 0 : lndBalance
  const briaHot = hotBalance instanceof Error ? 0 : Number(hotBalance.amount)
  const briaCold = coldStorage instanceof Error ? 0 : Number(coldStorage.amount)

  return (
    lnd + // physical assets
    briaCold + // physical assets
    briaHot + // physical assets
    (lightning + bitcoin + onChain) // value in accounting
  )
}

createGauge({
  name: "totalPendingHtlcCount",
  description: "How many pending HTLCs there are in the channels of the active nodes",
  collect: async () => {
    const totalPendingHtlcCount = await Lightning.getTotalPendingHtlcCount()
    if (totalPendingHtlcCount instanceof Error) return NaN
    return totalPendingHtlcCount
  },
})

createGauge({
  name: "incomingPendingHtlcCount",
  description:
    "How many pending incoming HTLCs there are in the channels of the active nodes",
  collect: async () => {
    const incomingPendingHtlcCount = await Lightning.getIncomingPendingHtlcCount()
    if (incomingPendingHtlcCount instanceof Error) return NaN
    return incomingPendingHtlcCount
  },
})

createGauge({
  name: "outgoingPendingHtlcCount",
  description:
    "How many pending outgoing HTLCs there are in the channels of the active nodes",
  collect: async () => {
    const outgoingPendingHtlcCount = await Lightning.getOutgoingPendingHtlcCount()
    if (outgoingPendingHtlcCount instanceof Error) return NaN
    return outgoingPendingHtlcCount
  },
})

createGauge({
  name: "getHeldInvoicesCount",
  description: "How many hold invoices are not settled or declined",
  collect: async () => {
    const heldInvoicesCount = await Lightning.getHeldInvoicesCount()
    if (heldInvoicesCount instanceof Error) return NaN
    return heldInvoicesCount
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
