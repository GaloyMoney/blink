import { yamlConfig } from "@config"
import { setupMongoConnection } from "@services/mongodb"

import { getFunderWalletId } from "@services/ledger/caching"
import { SATS_PER_BTC } from "@domain/bitcoin"
import { PriceHistory } from "@services/price/schema"
import { toObjectId } from "@services/mongoose/utils"
import { adminUsers } from "@domain/admin-users"

import { fundLnd, mineBlockAndSyncAll } from "./lightning"

import {
  chunk,
  generateSatoshiPriceHistory,
  bitcoindClient,
  createUserWallet,
  fundWalletIdFromOnchain,
  lnd1,
  lnd2,
  lndOutside1,
  lndOutside2,
  mineAndConfirm,
  bitcoindOutside,
  resetDatabase,
  resetLnds,
  setChannelFees,
  openChannelTesting,
} from "test/helpers"

const populatePriceData = async () => {
  const pair = "BTC/USD"
  const exchange = "bitfinex"
  let doc = await PriceHistory.findOne({
    "pair.name": pair,
    "pair.exchange.name": exchange,
  })

  if (doc) {
    return
  }

  doc = new PriceHistory({ pair: { name: pair, exchange: { name: exchange } } })
  await doc.save()

  const bulkOps = chunk(generateSatoshiPriceHistory(1 * 12, 50000), 500).map((c) => ({
    updateOne: {
      filter: { _id: toObjectId<UserId>(doc.id) },
      update: {
        $push: {
          "pair.exchange.price": {
            $each: c.map((d) => ({ _id: d.date, o: d.price / SATS_PER_BTC })),
          },
        },
      },
    },
  }))

  await PriceHistory.bulkWrite(bulkOps, { ordered: true })
}

export type TestingStateConfig = {
  resetState: boolean
  userAccounts: {
    phone: PhoneNumber
    phoneMetadataCarrierType?: string
    username?: string
    role?: string
    title?: string
  }[]
  outsideWalletBlocksToMineAndConfirm: number
  fundFunderWallet?: {
    amountInBitcoin: number
    receivingNode: AuthenticatedLnd
  }
  lndFunding: AuthenticatedLnd[]
  channelOpens: {
    lnd: AuthenticatedLnd
    lndPartner: AuthenticatedLnd
    socket: string
    is_private?: boolean
  }[]
  populatePriceData: boolean
}

export const defaultStateConfig = (): TestingStateConfig => ({
  resetState: true,
  userAccounts: [...yamlConfig.test_accounts, ...adminUsers],
  outsideWalletBlocksToMineAndConfirm: 10,
  fundFunderWallet: {
    amountInBitcoin: 1,
    receivingNode: lnd1,
  },
  lndFunding: [lndOutside1, lndOutside2],
  channelOpens: [
    {
      lnd: lnd1,
      lndPartner: lnd2,
      socket: `lnd2:9735`,
    },
    {
      lnd: lnd1,
      lndPartner: lndOutside1,
      socket: `lnd-outside-1:9735`,
    },
    {
      lnd: lndOutside1,
      lndPartner: lnd1,
      socket: `lnd1:9735`,
    },
    {
      lnd: lnd1,
      lndPartner: lndOutside2,
      socket: `lnd-outside-2:9735`,
    },
    {
      lnd: lndOutside1,
      lndPartner: lndOutside2,
      socket: `lnd-outside-2:9735`,
      is_private: true,
    },
  ],
  populatePriceData: true,
})

export const initializeTestingState = async (stateConfig: TestingStateConfig) => {
  const mongoose = await setupMongoConnection(true)

  // Ensure outside wallet exists
  const existingWallets = await bitcoindClient.listWalletDir()
  const loadedWallets = await bitcoindClient.listWallets()
  if (!existingWallets.map((wallet) => wallet.name).includes("outside")) {
    await bitcoindClient.createWallet({ walletName: "outside" })
  } else if (!loadedWallets.includes("outside")) {
    await bitcoindClient.loadWallet({ filename: "outside" })
  }

  // Reset state
  if (stateConfig.resetState) {
    await Promise.all([resetLnds(), resetDatabase(mongoose)])
  }

  // Fund outside wallet
  if (stateConfig.outsideWalletBlocksToMineAndConfirm > 0) {
    const bitcoindAddress = await bitcoindOutside.getNewAddress()
    await mineAndConfirm({
      walletClient: bitcoindOutside,
      numOfBlocks: stateConfig.outsideWalletBlocksToMineAndConfirm,
      address: bitcoindAddress,
    })
  }

  // Create test users and mandatory users
  await Promise.all(
    stateConfig.userAccounts.map((accountEntry) => createUserWallet(accountEntry)),
  )

  // Fund special wallets
  if (stateConfig.fundFunderWallet) {
    const funderWalletId = await getFunderWalletId()
    await fundWalletIdFromOnchain({
      walletId: funderWalletId,
      amountInBitcoin: stateConfig.fundFunderWallet.amountInBitcoin,
      lnd: stateConfig.fundFunderWallet.receivingNode,
    })
  }

  // Fund external lnd
  if (stateConfig.lndFunding.length > 0) {
    const fundingPromises: Promise<void>[] = []
    for (const lndInstance of stateConfig.lndFunding) {
      fundingPromises.push(fundLnd(lndInstance))
    }
    await Promise.all([fundLnd(lndOutside1), fundLnd(lndOutside2)])
    await mineBlockAndSyncAll()
  }

  // Open ln channels
  if (stateConfig.channelOpens.length > 0) {
    for (const channel of stateConfig.channelOpens) {
      await openChannelTesting(channel)
      await Promise.all([
        setChannelFees({ lnd: channel.lnd, channel, base: 0, rate: 0 }),
        setChannelFees({ lnd: channel.lndPartner, channel, base: 0, rate: 0 }),
      ])
    }
    await mineBlockAndSyncAll()
  }

  // Populate price data
  if (stateConfig.populatePriceData) {
    await populatePriceData()
  }
}
