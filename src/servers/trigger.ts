import express from "express"
import {
  GetInvoiceResult,
  subscribeToBackups,
  subscribeToBlocks,
  subscribeToChannels,
  subscribeToInvoices,
  subscribeToTransactions,
  SubscribeToTransactionsChainTransactionEvent,
} from "lightning"

import { ONCHAIN_MIN_CONFIRMATIONS } from "@config"

import { Prices } from "@app"
import * as Wallets from "@app/wallets"
import { uploadBackup } from "@app/admin/backup"

import { toSats } from "@domain/bitcoin"
import { CacheKeys } from "@domain/cache"

import { baseLogger } from "@services/logger"
import { LedgerService } from "@services/ledger"
import { RedisCacheService } from "@services/cache"
import { onChannelUpdated } from "@services/lnd/utils"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { setupMongoConnection } from "@services/mongodb"
import { NotificationsService } from "@services/notifications"
import { asyncRunInSpan, SemanticAttributes } from "@services/tracing"
import { activateLndHealthCheck, lndStatusEvent } from "@services/lnd/health"

import { DisplayCurrency, DisplayCurrencyConverter } from "@domain/fiat"

import healthzHandler from "./middlewares/healthz"

const redisCache = RedisCacheService()
const logger = baseLogger.child({ module: "trigger" })

export async function onchainTransactionEventHandler(
  tx: SubscribeToTransactionsChainTransactionEvent,
) {
  logger.info({ tx }, "received new onchain tx event")
  const onchainLogger = logger.child({
    topic: "payment",
    protocol: "onchain",
    tx,
    onUs: false,
  })

  const fee = tx.fee || 0
  const txHash = tx.id as OnChainTxHash

  if (tx.is_outgoing) {
    if (!tx.is_confirmed) {
      return
      // FIXME
      // we have to return here because we will not know whose user the the txid belong to
      // this is because of limitation for lnd onchain wallet. we only know the txid after the
      // transaction has been sent. and this events is trigger before
    }

    const settled = await LedgerService().settlePendingOnChainPayment(txHash)

    if (settled instanceof Error) {
      onchainLogger.error(
        { success: false, settled, transactionType: "payment" },
        "payment settle fail",
      )
      return
    }

    onchainLogger.info(
      { success: true, pending: false, transactionType: "payment" },
      "payment completed",
    )

    // FIXME a tx.id should return a walletId[] instead, in case
    // multiple UXTO goes to the wallet within the same tx
    const walletId = await LedgerService().getWalletIdByTransactionHash(txHash)
    if (walletId instanceof Error) {
      logger.info({ tx, walletId }, "impossible to find wallet id")
      return
    }

    let displayPaymentAmount: DisplayPaymentAmount<DisplayCurrency> | undefined

    const price = await Prices.getCurrentPrice()
    const displayCurrencyPerSat = price instanceof Error ? undefined : price
    if (displayCurrencyPerSat) {
      const converter = DisplayCurrencyConverter(displayCurrencyPerSat)
      const amount = converter.fromSats(toSats(tx.tokens - fee))
      displayPaymentAmount = { amount, currency: DisplayCurrency.Usd }
    }

    const senderWallet = await WalletsRepository().findById(walletId)
    if (senderWallet instanceof Error) return senderWallet

    const senderAccount = await AccountsRepository().findById(senderWallet.accountId)
    if (senderAccount instanceof Error) return senderAccount

    const senderUser = await UsersRepository().findById(senderAccount.ownerId)
    if (senderUser instanceof Error) return senderUser

    await NotificationsService().onChainTxSent({
      senderAccountId: senderWallet.accountId,
      senderWalletId: senderWallet.id,
      // TODO: tx.tokens represent the total sum, need to segregate amount by address
      paymentAmount: { amount: BigInt(tx.tokens - fee), currency: senderWallet.currency },
      displayPaymentAmount,
      txHash,
      senderDeviceTokens: senderUser.deviceTokens,
      senderLanguage: senderUser.language,
    })
  } else {
    // incoming transaction

    redisCache.clear(CacheKeys.LastOnChainTransactions)

    const walletsRepo = WalletsRepository()

    const outputAddresses = tx.output_addresses as OnChainAddress[]

    const wallets = await walletsRepo.listByAddresses(outputAddresses)
    if (wallets instanceof Error) return

    // we only handle pending notification here because we wait more than 1 block
    if (!tx.is_confirmed) {
      onchainLogger.info(
        { transactionType: "receipt", pending: true },
        "mempool appearance",
      )

      let displayPaymentAmount: DisplayPaymentAmount<DisplayCurrency> | undefined

      const price = await Prices.getCurrentPrice()
      const displayCurrencyPerSat = price instanceof Error ? undefined : price
      if (displayCurrencyPerSat) {
        const converter = DisplayCurrencyConverter(displayCurrencyPerSat)
        // TODO: tx.tokens represent the total sum, need to segregate amount by address
        const amount = converter.fromSats(toSats(tx.tokens))
        displayPaymentAmount = { amount, currency: DisplayCurrency.Usd }
      }

      wallets.forEach(async (wallet) => {
        const recipientAccount = await AccountsRepository().findById(wallet.accountId)
        if (recipientAccount instanceof Error) return recipientAccount

        const recipientUser = await UsersRepository().findById(recipientAccount.ownerId)
        if (recipientUser instanceof Error) return recipientUser

        NotificationsService().onChainTxReceivedPending({
          recipientAccountId: wallet.accountId,
          recipientWalletId: wallet.id,
          // TODO: tx.tokens represent the total sum, need to segregate amount by address
          paymentAmount: { amount: BigInt(tx.tokens), currency: wallet.currency },
          displayPaymentAmount,
          txHash,
          recipientDeviceTokens: recipientUser.deviceTokens,
          recipientLanguage: recipientUser.language,
        })
      })
    }
  }
}

export async function onchainBlockEventhandler({ height }) {
  const scanDepth = (ONCHAIN_MIN_CONFIRMATIONS + 1) as ScanDepth
  const txNumber = await Wallets.updateOnChainReceipt({ scanDepth, logger })
  if (txNumber instanceof Error) {
    logger.error(
      { error: txNumber },
      `error updating onchain receipt for block ${height}`,
    )
    return
  }
  logger.info(`finish block ${height} handler with ${txNumber} transactions`)
}

export const onInvoiceUpdate = async (invoice: GetInvoiceResult) => {
  logger.info({ invoice }, "onInvoiceUpdate")

  if (!invoice.is_confirmed) {
    return
  }

  const paymentHash = invoice.id as PaymentHash

  await Wallets.updatePendingInvoiceByPaymentHash({ paymentHash, logger })
}

export const publishSingleCurrentPrice = async () => {
  const displayCurrencyPerSat = await Prices.getCurrentPrice()
  if (displayCurrencyPerSat instanceof Error) {
    return logger.error({ err: displayCurrencyPerSat }, "can't publish the price")
  }
  NotificationsService().priceUpdate(displayCurrencyPerSat)
}

const publishCurrentPrice = () => {
  const interval: Seconds = (1000 * 30) as Seconds
  return setInterval(async () => {
    await publishSingleCurrentPrice()
  }, interval)
}

const listenerOnchain = ({ lnd }) => {
  const subTransactions = subscribeToTransactions({ lnd })
  subTransactions.on("chain_transaction", onchainTransactionEventHandler)

  subTransactions.on("error", (err) => {
    baseLogger.error({ err }, "error subTransactions")
  })

  const subBlocks = subscribeToBlocks({ lnd })
  subBlocks.on("block", async ({ height }) =>
    asyncRunInSpan(
      "servers.trigger.onchainBlockEventhandler",
      {
        root: true,
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: "onchainBlockEventhandler",
          [SemanticAttributes.CODE_NAMESPACE]: "servers.trigger",
          [`${SemanticAttributes.CODE_FUNCTION}.params.height`]: height,
        },
      },
      async () => {
        onchainBlockEventhandler({ height })
      },
    ),
  )

  subBlocks.on("error", (err) => {
    baseLogger.error({ err }, "error subBlocks")
  })
}

const listenerOffchain = ({ lnd, pubkey }) => {
  const subInvoices = subscribeToInvoices({ lnd })
  subInvoices.on("invoice_updated", onInvoiceUpdate)
  subInvoices.on("error", (err) => {
    baseLogger.info({ err }, "error subInvoices")
    subInvoices.removeAllListeners()
  })

  const subChannels = subscribeToChannels({ lnd })
  subChannels.on("channel_opened", (channel) =>
    onChannelUpdated({ channel, lnd, stateChange: "opened" }),
  )
  subChannels.on("channel_closed", (channel) =>
    onChannelUpdated({ channel, lnd, stateChange: "closed" }),
  )
  subChannels.on("error", (err) => {
    baseLogger.info({ err }, "error subChannels")
    subChannels.removeAllListeners()
  })

  const subBackups = subscribeToBackups({ lnd })
  subBackups.on("backup", ({ backup }) =>
    asyncRunInSpan(
      "servers.trigger.uploadBackup",
      {
        root: true,
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: "uploadBackup",
          [SemanticAttributes.CODE_NAMESPACE]: "servers.trigger",
        },
      },
      async () => {
        uploadBackup(logger)({ backup, pubkey })
      },
    ),
  )
  subBackups.on("error", (err) => {
    baseLogger.info({ err }, "error subBackups")
    subBackups.removeAllListeners()
  })
}

const main = () => {
  lndStatusEvent.on("started", ({ lnd, pubkey, socket, type }) => {
    baseLogger.info({ socket }, "lnd started")

    if (type.indexOf("onchain") !== -1) {
      listenerOnchain({ lnd })
    }

    if (type.indexOf("offchain") !== -1) {
      listenerOffchain({ lnd, pubkey })
    }
  })

  lndStatusEvent.on("stopped", ({ socket }) => {
    baseLogger.info({ socket }, "lnd stopped")
  })

  activateLndHealthCheck()
  publishCurrentPrice()
}

const healthCheck = () => {
  const app = express()
  const port = process.env.PORT || 8888
  app.get(
    "/healthz",
    healthzHandler({
      checkDbConnectionStatus: true,
      checkRedisStatus: true,
      checkLndsStatus: true,
    }),
  )
  app.listen(port, () => logger.info(`Health check listening on port ${port}!`))
}

// only execute if it is the main module
if (require.main === module) {
  healthCheck()
  setupMongoConnection()
    .then(main)
    .catch((err) => logger.error(err))
}
