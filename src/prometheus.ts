import { setupMongoConnection } from "./mongodb"
// this import before medici


import { LightningAdminWallet } from "./LightningAdminImpl";
import { Price } from "./priceImpl";

const express = require('express');
const server = express();

const client = require('prom-client');
const register = require('prom-client').register
const mongoose = require("mongoose");

const equity_g = new client.Gauge({ name: 'shareholder', help: 'value of shareholder' })
const customers_g = new client.Gauge({ name: 'customers', help: 'how much money customers has' })
const lightning_g = new client.Gauge({ name: 'lightning', help: 'how much money there is on lnd' })
// const price_g = new client.Gauge({ name: 'price', help: 'BTC/USD price' })

const main = async () => {

  const User = mongoose.model("User")
  const admin = await User.findOne({role: "admin"})
	const adminWallet = new LightningAdminWallet({uid: admin._id})

  server.get('/metrics', async (req, res) => {
    
    try {
      const price = new Price()
      await price.update()
    } catch (err) {
      console.error(`issue getting price: ${err}`)
    }

    await adminWallet.updateEscrows()
    await adminWallet.updateUsersPendingPayment()
    
    const {customers, equity, lightning} = await adminWallet.getBalanceSheet()

    equity_g.set(equity)
    customers_g.set(customers)
    lightning_g.set(lightning)
    // price_g.set(price)

    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
  })

  server.get('/healthz', async (req, res) => {
    res.send('OK')
  })
    
  const port = process.env.PORT || 3000;
  console.log(
    `Server listening to ${port}, metrics exposed on /metrics endpoint`,
  )
  server.listen(port);
}

setupMongoConnection().then(() => main()).catch((err) => console.log(err))