import { AdminWallet } from "./AdminWallet";
import { BrokerWallet } from "./BrokerWallet";
import { setupMongoConnection, User } from "./mongodb";
import { Price } from "./priceImpl";
import { logger } from "./utils";
import { getBrokerWallet, WalletFactory } from "./walletFactory";

const express = require('express');
const server = express();

const client = require('prom-client');
const register = require('prom-client').register

const liabilities_g = new client.Gauge({ name: 'liabilities', help: 'how much money customers has' })
const lightning_g = new client.Gauge({ name: 'lightning', help: 'how much money there is our books for lnd' })
const lnd_g = new client.Gauge({ name: 'lnd', help: 'how much money in our node' })
const lndOnChain_g = new client.Gauge({ name: 'lnd_onchain', help: 'how much fund is onChain in lnd' })
const lndOffChain_g = new client.Gauge({ name: 'lnd_offchain', help: 'how much fund is offChain in our node' })
const assetsLiabilitiesDifference_g = new client.Gauge({ name: 'assetsEqLiabilities', help: 'do we have a balanced book' })
const bookingVersusRealWorldAssets_g = new client.Gauge({ name: 'lndBalanceSync', help: 'are lnd in syncs with our books' })
const usd_liabilities_g = new client.Gauge({ name: 'usdLiabilities', help: 'usd liabilities' })
const usdShortPosition_g = new client.Gauge({ name: 'usdShortPosition', help: 'usd short position on ftx' })
const ftx_btc_g = new client.Gauge({ name: 'ftxBtcBalance', help: 'btc balance in ftx' })
const leverage_g = new client.Gauge({ name: 'leverage', help: 'leverage ratio on ftx' })
const userCount_g = new client.Gauge({ name: 'userCount', help: 'how much users have registered' })
// const price_g = new client.Gauge({ name: 'price', help: 'BTC/USD price' })

const main = async () => {
	const adminWallet = new AdminWallet()

  server.get('/metrics', async (req, res) => {
    
    try {
      const price = new Price()
      await price.update()
    } catch (err) {
      logger.error(`issue getting price: ${err}`)
    }
    
    const { lightning, liabilities, usd: usd_liabilities } = await adminWallet.getBalanceSheet()
    const { assetsLiabilitiesDifference, bookingVersusRealWorldAssets } = await adminWallet.balanceSheetIsBalanced()
    liabilities_g.set(liabilities)
    lightning_g.set(lightning)
    assetsLiabilitiesDifference_g.set(assetsLiabilitiesDifference)
    bookingVersusRealWorldAssets_g.set(bookingVersusRealWorldAssets)
    
    const { total, onChain, offChain } = await adminWallet.lndBalances()
    lnd_g.set(total)
    lndOnChain_g.set(onChain)
    lndOffChain_g.set(offChain)
    // price_g.set(price)
        
    const userCount = await User.count()
    userCount_g.set(userCount)
    
    usd_liabilities_g.set(usd_liabilities)
    ftx_btc_g.set(await adminWallet.ftxBalance())

    const brokerWallet = await getBrokerWallet()
    const { usd: usdShortPosition, leverage } = await brokerWallet.getAccountPosition()

    usdShortPosition_g.set(usdShortPosition)
    leverage_g.set(leverage)

    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
  })

  server.get('/healthz', async (req, res) => {
    res.send('OK')
  })
    
  const port = process.env.PORT || 3000;
  logger.info(
    `Server listening to ${port}, metrics exposed on /metrics endpoint`,
  )
  server.listen(port);
}

setupMongoConnection().then(() => main()).catch((err) => logger.error(err))